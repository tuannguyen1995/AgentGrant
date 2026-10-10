import pytest
import json
import os
import sys
import types

# Ensure contracts directory is reachable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "contracts")))


# ---------------------------------------------------------------------------
# Simulated GenLayer Environment for robust local pytest execution
# ---------------------------------------------------------------------------
class SimulatedAddress:
    def __init__(self, hex_addr: str):
        self.as_hex = hex_addr.lower()

    def __str__(self):
        return self.as_hex

    def __eq__(self, other):
        return str(self).lower() == str(other).lower()


class MockTransferContract:
    def __init__(self, address):
        self.address = str(address)
        self.transfers = []

    def emit_transfer(self, value):
        self.transfers.append({"to": self.address, "value": int(value)})
        return True


class MockReturn:
    def __init__(self, calldata):
        self.calldata = calldata


class MockMessage:
    def __init__(self, sender_address="0x1111111111111111111111111111111111111111", value=0):
        self.sender_address = sender_address
        self.value = value

    @property
    def sender(self):
        return self.sender_address

    @sender.setter
    def sender(self, val):
        self.sender_address = val


class MockNondetWeb:
    def __init__(self):
        self.mock_responses = {}

    def render(self, url, mode="text"):
        if url in self.mock_responses:
            return self.mock_responses[url]
        return "P_VALUE:0.003 SAMPLE_SIZE:480 CONTROL_VALIDATED:TRUE REPRODUCIBLE NREL_CERTIFIED_EFFICIENCY:22.4%"


class MockNondet:
    def __init__(self):
        self.web = MockNondetWeb()
        self.llm_response = {
            "canary": "CANARY_AGENT_GRANT_DESCI_V1",
            "verdict": "MILESTONE_ACCEPTED_FULL",
            "confidence": 98,
            "rigor_score": 92,
            "reproducibility_pct": 88,
            "reason": "Complete raw sequencing data provided; statistical significance confirmed at p=0.003."
        }

    def exec_prompt(self, prompt, response_format="json"):
        return self.llm_response


class MockVM:
    class Return:
        def __init__(self, calldata):
            self.calldata = calldata

    def run_nondet(self, leader_fn, validator_fn):
        leader_res = leader_fn()
        valid = validator_fn(self.Return(leader_res))
        assert valid, "Validator function failed on leader result"
        return leader_res


class MockGenLayerEnv:
    def __init__(self):
        self.message = MockMessage()
        self.message_raw = {"datetime": "2026-10-10T12:00:00Z"}
        self.block = types.SimpleNamespace(number=1000, timestamp=1760000000)
        self.nondet = MockNondet()
        self.vm = MockVM()
        self.contracts = {}

    def get_contract_at(self, address):
        addr_str = str(address).lower()
        if addr_str not in self.contracts:
            self.contracts[addr_str] = MockTransferContract(addr_str)
        return self.contracts[addr_str]

    def advance_blocks(self, count: int = 30):
        """Advances the simulated GenVM block height and timestamp."""
        self.block.number += count
        self.block.timestamp += count * 2


def setup_gl_mock():
    mock_env = MockGenLayerEnv()

    gl_module = types.ModuleType("genlayer")

    class UserError(Exception):
        pass

    class ContractStorageBase:
        def __new__(cls, *args, **kwargs):
            instance = super().__new__(cls)
            instance.grants = {}
            instance.grant_ids = []
            return instance

    gl_module.UserError = UserError
    gl_module.Address = SimulatedAddress
    gl_module.bigint = lambda x: int(x)
    gl_module.u8 = lambda x: int(x)
    gl_module.u32 = lambda x: int(x)
    gl_module.u64 = lambda x: int(x)
    gl_module.u256 = lambda x: int(x)
    gl_module.TreeMap = dict
    gl_module.DynArray = list
    gl_module.allow_storage = lambda cls: cls
    gl_module.Contract = ContractStorageBase

    # Decorators
    class PublicDecorator:
        def view(self, fn): return fn
        def write(self, fn): return fn
        class WriteClass:
            def __call__(self, fn): return fn
            def payable(self, fn): return fn
        write = WriteClass()

    mock_public = PublicDecorator()
    mock_env.Contract = ContractStorageBase
    mock_env.public = mock_public
    mock_env.UserError = UserError
    gl_module.gl = mock_env

    sys.modules["genlayer"] = gl_module
    if "contract" in sys.modules:
        del sys.modules["contract"]

    return mock_env


# ---------------------------------------------------------------------------
# UNIT TESTS: Full Coverage for Roles, Block Clock, Appeals, and Payout Paths
# ---------------------------------------------------------------------------

def test_agentgrant_milestone_accepted_lifecycle():
    mock_env = setup_gl_mock()
    import contract
    contract.gl = mock_env

    app = contract.Contract()
    dao = SimulatedAddress("0x1111111111111111111111111111111111111111")
    researcher = SimulatedAddress("0x2222222222222222222222222222222222222222")

    # Step 1: DAO locks 1 GEN grant
    mock_env.message.sender_address = dao
    mock_env.message.value = 10**18
    gid = app.create_grant_milestone(
        project_title="CRISPR Off-Target Epigenetic Repair",
        methodology_spec="Require double-blind NGS sequencing with raw FASTQ counts and p < 0.01",
        duration_blocks=6000
    )
    assert gid == 1

    # Step 2: Researcher submits deliverable
    mock_env.message.sender_address = researcher
    mock_env.message.value = 0
    app.submit_research_deliverable(
        grant_id=gid,
        preprint_url="https://biorxiv.org/content/early/2026/crispr_repair_manuscript.txt",
        raw_dataset_url="https://zenodo.org/record/8921102/raw_sequencing_fastq.csv"
    )

    grant_json = json.loads(app.get_grant(gid))
    assert grant_json["status"] == 1  # STATUS_SUBMITTED
    assert grant_json["researcher"] == str(researcher).lower()

    # Step 3: DAO triggers peer-review adjudication
    mock_env.message.sender_address = dao
    app.adjudicate_peer_review(grant_id=gid)

    grant_json = json.loads(app.get_grant(gid))
    assert grant_json["status"] == 3  # STATUS_AWAITING_PAYOUT
    assert grant_json["verdict"] == "MILESTONE_ACCEPTED_FULL"
    assert grant_json["rigor_score"] == 92
    assert grant_json["reproducibility_pct"] == 88

    # Step 4: Advance past 24 blocks via block clock and finalize payout
    mock_env.advance_blocks(30)
    app.finalize_settlement(grant_id=gid)

    grant_json = json.loads(app.get_grant(gid))
    assert grant_json["status"] == 4  # STATUS_SETTLED_ACCEPTED
    assert grant_json["escrow_amount"] == "0"
    assert app.total_grant_locked == 0
    assert len(mock_env.get_contract_at(researcher).transfers) == 1
    assert mock_env.get_contract_at(researcher).transfers[0]["value"] == 10**18


def test_agentgrant_whistleblower_fraud_reporting_and_freeze():
    mock_env = setup_gl_mock()
    import contract
    contract.gl = mock_env

    app = contract.Contract()
    dao = SimulatedAddress("0x1111111111111111111111111111111111111111")
    researcher = SimulatedAddress("0x2222222222222222222222222222222222222222")
    whistleblower = SimulatedAddress("0x3333333333333333333333333333333333333333")

    mock_env.message.sender_address = dao
    mock_env.message.value = 2 * 10**18
    gid = app.create_grant_milestone(
        project_title="Ambient Superconductivity Carbon Lattice",
        methodology_spec="Meissner effect zero resistance verification at 295K with raw SQUID data",
        duration_blocks=6000
    )

    mock_env.message.sender_address = researcher
    app.submit_research_deliverable(
        grant_id=gid,
        preprint_url="https://arxiv.org/abs/2609.99214/manuscript.txt",
        raw_dataset_url="https://osf.io/squid_data_raw.csv"
    )

    # Whistleblower reports p-hacking with 5% bond (0.1 GEN)
    mock_env.message.sender_address = whistleblower
    mock_env.message.value = 10**17
    app.report_academic_fraud(
        grant_id=gid,
        fraud_evidence_url="https://pubpeer.com/publications/squid_fraud_audit.html",
        fraud_allegation="Severe p-hacking: step discontinuity at 295K is fabricated in CSV row 104-120."
    )

    grant_json = json.loads(app.get_grant(gid))
    assert grant_json["status"] == 2  # STATUS_FROZEN_FLAGGED
    assert grant_json["is_frozen"] is True
    assert grant_json["whistleblower"] == str(whistleblower).lower()

    # AI Court adjudicates with fraud detection
    mock_env.nondet.llm_response = {
        "canary": "CANARY_AGENT_GRANT_DESCI_V1",
        "verdict": "REJECTED_ACADEMIC_FRAUD",
        "confidence": 99,
        "rigor_score": 18,
        "reproducibility_pct": 10,
        "reason": "Whistleblower evidence validated: synthetic step discontinuity found, unreproducible."
    }

    mock_env.message.sender_address = dao
    app.adjudicate_peer_review(grant_id=gid)

    grant_json = json.loads(app.get_grant(gid))
    assert grant_json["status"] == 3  # STATUS_AWAITING_PAYOUT
    assert grant_json["verdict"] == "REJECTED_ACADEMIC_FRAUD"

    # Finalize settlement refunds DAO and rewards whistleblower after 24-block window
    mock_env.advance_blocks(30)
    app.finalize_settlement(grant_id=gid)

    grant_json = json.loads(app.get_grant(gid))
    assert grant_json["status"] == 5  # STATUS_SETTLED_FRAUD
    stats = json.loads(app.get_stats())
    assert stats["total_frauds_stopped"] == 1
    assert app.total_grant_locked == 0
    assert mock_env.get_contract_at(dao).transfers[-1]["value"] == 2 * 10**18
    assert mock_env.get_contract_at(whistleblower).transfers[-1]["value"] == 10**17


def test_agentgrant_emergency_freeze_and_unfreeze():
    mock_env = setup_gl_mock()
    import contract
    contract.gl = mock_env

    app = contract.Contract()
    dao = SimulatedAddress("0x1111111111111111111111111111111111111111")
    researcher = SimulatedAddress("0x2222222222222222222222222222222222222222")

    mock_env.message.sender_address = dao
    mock_env.message.value = 10**18
    gid = app.create_grant_milestone("Solid Electrolyte Battery", "Nyquist plot specs over 1000 cycles", 6000)

    mock_env.message.sender_address = researcher
    app.submit_research_deliverable(gid, "https://arxiv.org/paper.pdf", "https://github.com/data.csv")

    # DAO emergency freezes the grant
    mock_env.message.sender_address = dao
    app.emergency_freeze(gid, "Anomalous temperature spike reported in test cell.")

    g_json = json.loads(app.get_grant(gid))
    assert g_json["status"] == 2  # STATUS_FROZEN_FLAGGED
    assert g_json["is_frozen"] is True

    # DAO unfreezes after audit verification
    app.emergency_unfreeze(gid)
    g_json2 = json.loads(app.get_grant(gid))
    assert g_json2["is_frozen"] is False
    assert g_json2["status"] == 1  # back to STATUS_SUBMITTED


def test_agentgrant_appeal_upheld_accepted_flow():
    mock_env = setup_gl_mock()
    import contract
    contract.gl = mock_env

    app = contract.Contract()
    dao = SimulatedAddress("0x1111111111111111111111111111111111111111")
    researcher = SimulatedAddress("0x2222222222222222222222222222222222222222")

    mock_env.message.sender_address = dao
    mock_env.message.value = 10**18
    gid = app.create_grant_milestone(
        project_title="Quantum Dot Enzymatic Solar Cells",
        methodology_spec="Spectroscopy photon yield raw data exceeding 22% conversion efficiency",
        duration_blocks=6000
    )

    mock_env.message.sender_address = researcher
    app.submit_research_deliverable(
        grant_id=gid,
        preprint_url="https://zenodo.org/record/quantum_solar_preprint.txt",
        raw_dataset_url="https://github.com/lab/solar_raw_spectroscopy.csv"
    )

    mock_env.nondet.llm_response = {
        "canary": "CANARY_AGENT_GRANT_DESCI_V1",
        "verdict": "PARTIAL_REVISION_GRANT",
        "confidence": 90,
        "rigor_score": 68,
        "reproducibility_pct": 55,
        "reason": "Conversion efficiency verified at 19.8%, slight variation under ambient humidity."
    }

    mock_env.message.sender_address = dao
    app.adjudicate_peer_review(grant_id=gid)

    # Researcher appeals with 10% bond and attaches evidence URL
    mock_env.message.sender_address = researcher
    mock_env.message.value = 10**17
    app.appeal_verdict(
        grant_id=gid,
        dispute_reason="Third-party NREL calibration certifies >22.1% under standardized solar simulator.",
        supplemental_reproduction_url="https://nrel.gov/pv/calibration/cert_9881.txt"
    )

    grant_json = json.loads(app.get_grant(gid))
    assert grant_json["status"] == 7  # STATUS_DISPUTED
    assert grant_json["dispute_bond"] == str(10**17)
    assert grant_json["prior_verdict"] == "PARTIAL_REVISION_GRANT"
    assert grant_json["appeal_evidence_url"] == "https://nrel.gov/pv/calibration/cert_9881.txt"

    # Supreme Court adjudication upholds appeal
    mock_env.nondet.llm_response = {
        "canary": "CANARY_AGENT_GRANT_DESCI_V1",
        "verdict": "APPEAL_UPHELD_ACCEPTED",
        "reason": "Independent NREL laboratory verification confirms 22.4% cell efficiency."
    }

    # Supreme court executes adjudication
    mock_env.message.sender_address = dao
    app.adjudicate_appeal(grant_id=gid)

    final_data = json.loads(app.get_grant(gid))
    assert final_data["status"] == 4  # STATUS_SETTLED_ACCEPTED
    assert final_data["verdict"] == "MILESTONE_ACCEPTED_FULL"
    assert app.total_grant_locked == 0
    # Researcher gets 100% escrow (10^18) + bond refund (10^17)
    researcher_transfers = mock_env.get_contract_at(researcher).transfers
    assert any(t["value"] == 10**18 for t in researcher_transfers)
    assert any(t["value"] == 10**17 for t in researcher_transfers)


def test_agentgrant_appeal_dismissed_dao_appellant_preserves_acceptance():
    """
    Steward Pavel Kolosov catch:
    If DAO appeals an accepted milestone (e.g. alleging late defect) and the appeal is DISMISSED,
    the contract must preserve MILESTONE_ACCEPTED_FULL:
    - Escrow (100%) goes to Researcher
    - Dispute bond goes to Researcher (counterparty)
    - Total locked decrements to 0
    """
    mock_env = setup_gl_mock()
    import contract
    contract.gl = mock_env

    app = contract.Contract()
    dao = SimulatedAddress("0x1111111111111111111111111111111111111111")
    researcher = SimulatedAddress("0x2222222222222222222222222222222222222222")

    mock_env.message.sender_address = dao
    mock_env.message.value = 10**18
    gid = app.create_grant_milestone(
        project_title="Synthetic Organoid Neural Tissue",
        methodology_spec="Patch-clamp electrophysiology validation with open-source raw SpikeTrain data",
        duration_blocks=6000
    )

    mock_env.message.sender_address = researcher
    app.submit_research_deliverable(
        grant_id=gid,
        preprint_url="https://biorxiv.org/organoid.txt",
        raw_dataset_url="https://zenodo.org/spiketrain.csv"
    )

    # Initial peer review: ACCEPTED FULL
    mock_env.nondet.llm_response = {
        "canary": "CANARY_AGENT_GRANT_DESCI_V1",
        "verdict": "MILESTONE_ACCEPTED_FULL",
        "confidence": 95,
        "rigor_score": 90,
        "reproducibility_pct": 92,
        "reason": "Electrophysiology traces validated; full spike records verified."
    }
    mock_env.message.sender_address = dao
    app.adjudicate_peer_review(grant_id=gid)

    grant_json = json.loads(app.get_grant(gid))
    assert grant_json["verdict"] == "MILESTONE_ACCEPTED_FULL"

    # DAO disputes and appeals with 10% bond
    mock_env.message.sender_address = dao
    mock_env.message.value = 10**17
    app.appeal_verdict(
        grant_id=gid,
        dispute_reason="DAO committee requests re-checking channel noise threshold.",
        supplemental_reproduction_url="https://dao-audit.org/channel_noise.txt"
    )

    grant_json = json.loads(app.get_grant(gid))
    assert grant_json["status"] == 7  # STATUS_DISPUTED
    assert grant_json["prior_verdict"] == "MILESTONE_ACCEPTED_FULL"

    # Appellate AI council dismisses DAO appeal
    mock_env.nondet.llm_response = {
        "canary": "CANARY_AGENT_GRANT_DESCI_V1",
        "verdict": "APPEAL_DISMISSED",
        "reason": "Channel noise is within standard patch-clamp tolerance; initial acceptance confirmed."
    }
    mock_env.message.sender_address = researcher
    app.adjudicate_appeal(grant_id=gid)

    final_data = json.loads(app.get_grant(gid))
    assert final_data["status"] == 4  # STATUS_SETTLED_ACCEPTED
    assert final_data["verdict"] == "MILESTONE_ACCEPTED_FULL"
    assert "PRIOR ACCEPTANCE AFFIRMED" in final_data["reason"]
    assert app.total_grant_locked == 0

    # Researcher receives 100% escrow (10^18) AND the forfeited DAO dispute bond (10^17)
    researcher_transfers = mock_env.get_contract_at(researcher).transfers
    assert any(t["value"] == 10**18 for t in researcher_transfers)
    assert any(t["value"] == 10**17 for t in researcher_transfers)
    # DAO received nothing
    dao_transfers = mock_env.get_contract_at(dao).transfers
    assert len(dao_transfers) == 0


def test_agentgrant_appeal_dismissed_researcher_appellant_preserves_fraud():
    """
    If Researcher appeals a fraud verdict and the appeal is DISMISSED:
    - Escrow (100%) refunded to DAO
    - Dispute bond forfeited to DAO (counterparty)
    - Status is STATUS_SETTLED_FRAUD
    - Total locked decrements cleanly to 0
    """
    mock_env = setup_gl_mock()
    import contract
    contract.gl = mock_env

    app = contract.Contract()
    dao = SimulatedAddress("0x1111111111111111111111111111111111111111")
    researcher = SimulatedAddress("0x2222222222222222222222222222222222222222")

    mock_env.message.sender_address = dao
    mock_env.message.value = 10**18
    gid = app.create_grant_milestone("Room Temp Superconductor", "SQUID magnetometry at 300K", 6000)

    mock_env.message.sender_address = researcher
    app.submit_research_deliverable(gid, "https://arxiv.org/lk99.txt", "https://github.com/data.csv")

    # Initial peer review: REJECTED_ACADEMIC_FRAUD
    mock_env.nondet.llm_response = {
        "canary": "CANARY_AGENT_GRANT_DESCI_V1",
        "verdict": "REJECTED_ACADEMIC_FRAUD",
        "confidence": 98,
        "rigor_score": 15,
        "reproducibility_pct": 5,
        "reason": "Resistance drop is an artifact of ferromagnetism, not superconductivity."
    }
    mock_env.message.sender_address = dao
    app.adjudicate_peer_review(grant_id=gid)

    # Researcher appeals with 10% bond
    mock_env.message.sender_address = researcher
    mock_env.message.value = 10**17
    app.appeal_verdict(
        grant_id=gid,
        dispute_reason="Independent replication underway at auxiliary lab.",
        supplemental_reproduction_url="https://aux-lab.org/replication.txt"
    )

    # Appeal dismissed
    mock_env.nondet.llm_response = {
        "canary": "CANARY_AGENT_GRANT_DESCI_V1",
        "verdict": "APPEAL_DISMISSED",
        "reason": "Replication failed to produce zero resistance."
    }
    mock_env.message.sender_address = dao
    app.adjudicate_appeal(grant_id=gid)

    final_data = json.loads(app.get_grant(gid))
    assert final_data["status"] == 5  # STATUS_SETTLED_FRAUD
    assert final_data["verdict"] == "REJECTED_ACADEMIC_FRAUD"
    assert "PRIOR FRAUD AFFIRMED" in final_data["reason"]
    assert app.total_grant_locked == 0

    # DAO receives 100% escrow refund (10^18) AND the forfeited researcher dispute bond (10^17)
    dao_transfers = mock_env.get_contract_at(dao).transfers
    assert any(t["value"] == 10**18 for t in dao_transfers)
    assert any(t["value"] == 10**17 for t in dao_transfers)


def test_agentgrant_appellate_evidence_restricted_to_bonded_appellant():
    mock_env = setup_gl_mock()
    import contract
    contract.gl = mock_env

    app = contract.Contract()
    dao = SimulatedAddress("0x1111111111111111111111111111111111111111")
    researcher = SimulatedAddress("0x2222222222222222222222222222222222222222")
    stranger = SimulatedAddress("0x8888888888888888888888888888888888888888")

    mock_env.message.sender_address = dao
    mock_env.message.value = 10**18
    gid = app.create_grant_milestone("RNA Epigenetics", "m6A methylation sequencing", 6000)

    mock_env.message.sender_address = researcher
    app.submit_research_deliverable(gid, "https://biorxiv.org/rna.txt", "https://zenodo.org/data.csv")

    mock_env.message.sender_address = dao
    app.adjudicate_peer_review(grant_id=gid)

    # Researcher appeals
    mock_env.message.sender_address = researcher
    mock_env.message.value = 10**17
    app.appeal_verdict(gid, "Valid dispute reason over sequencing coverage depth.")

    # Stranger attempts to inject supplemental evidence into adjudication -> rejected
    mock_env.message.sender_address = stranger
    with pytest.raises(contract.gl.UserError, match="Permission Denied: Only the bonded appellant can provide or update appellate evidence"):
        app.adjudicate_appeal(gid, supplemental_reproduction_url="https://stranger-tampered.org/fake.txt")


def test_agentgrant_cancel_or_reclaim_lifecycle():
    """
    Tests DAO cancel and escrow reclaim lifecycle:
    - Reclaim before duration expires should fail.
    - Reclaim after expiration succeeds and dispatches 100% escrow back to DAO.
    """
    mock_env = setup_gl_mock()
    import contract
    contract.gl = mock_env

    app = contract.Contract()
    dao = SimulatedAddress("0x1111111111111111111111111111111111111111")

    mock_env.message.sender_address = dao
    mock_env.message.value = 10**18
    gid = app.create_grant_milestone(
        project_title="Unclaimed Dark Matter Search",
        methodology_spec="Cryogenic liquid xenon detector specs",
        duration_blocks=100
    )

    # Premature cancel attempt fails
    with pytest.raises(contract.gl.UserError, match="Cannot cancel: Grant milestone duration has not expired"):
        app.cancel_or_reclaim(gid)

    # Advance clock past duration (100 blocks)
    mock_env.advance_blocks(110)

    # Reclaim succeeds
    app.cancel_or_reclaim(gid)

    grant_json = json.loads(app.get_grant(gid))
    assert grant_json["status"] == 8  # STATUS_CANCELLED
    assert grant_json["verdict"] == "CANCELLED"
    assert app.total_grant_locked == 0
    assert len(mock_env.get_contract_at(dao).transfers) == 1
    assert mock_env.get_contract_at(dao).transfers[0]["value"] == 10**18


def test_agentgrant_role_violations_and_edge_cases():
    mock_env = setup_gl_mock()
    import contract
    contract.gl = mock_env

    app = contract.Contract()
    dao = SimulatedAddress("0x1111111111111111111111111111111111111111")
    attacker = SimulatedAddress("0x9999999999999999999999999999999999999999")

    # 1. Zero funding rejected
    mock_env.message.sender_address = dao
    mock_env.message.value = 0
    with pytest.raises(contract.gl.UserError, match="must be greater than 0 GEN"):
        app.create_grant_milestone("Short", "Valid Spec Long Enough", 6000)

    # 2. Grantor cannot claim their own grant
    mock_env.message.value = 10**18
    gid = app.create_grant_milestone("Solid State Battery Electrolyte", "Impedance spectroscopy specs and raw cycles", 6000)

    with pytest.raises(contract.gl.UserError, match="Grantor DAO cannot claim their own research grant"):
        app.submit_research_deliverable(gid, "https://arxiv.org/paper.pdf", "https://zenodo.org/data.csv")

    # Legitimate researcher submits
    researcher = SimulatedAddress("0x7777777777777777777777777777777777777777")
    mock_env.message.sender_address = researcher
    app.submit_research_deliverable(gid, "https://arxiv.org/paper.pdf", "https://zenodo.org/data.csv")

    # 3. Unauthorized attacker cannot emergency freeze
    mock_env.message.sender_address = attacker
    with pytest.raises(contract.gl.UserError, match="Permission Denied"):
        app.emergency_freeze(gid, "Fake freeze")
