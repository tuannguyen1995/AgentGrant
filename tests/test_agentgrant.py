import pytest
import json
import os
import sys

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
        self.transfers.append({"to": self.address, "value": value})
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
        return "P_VALUE:0.003 SAMPLE_SIZE:480 CONTROL_VALIDATED:TRUE REPRODUCIBLE"


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
        self.nondet = MockNondet()
        self.vm = MockVM()
        self.contracts = {}

    def get_contract_at(self, address):
        addr_str = str(address).lower()
        if addr_str not in self.contracts:
            self.contracts[addr_str] = MockTransferContract(addr_str)
        return self.contracts[addr_str]


def setup_gl_mock():
    import types
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
# UNIT TESTS: Full Coverage for Roles, Whistleblowing, Freezing, Appeals
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

    # Step 4: Advance past 24 blocks and finalize payout
    app.grant_counter = 100
    app.finalize_settlement(grant_id=gid)

    grant_json = json.loads(app.get_grant(gid))
    assert grant_json["status"] == 4  # STATUS_SETTLED_ACCEPTED
    assert grant_json["escrow_amount"] == "0"


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

    # Finalize settlement refunds DAO and rewards whistleblower
    app.grant_counter = 120
    app.finalize_settlement(grant_id=gid)

    grant_json = json.loads(app.get_grant(gid))
    assert grant_json["status"] == 5  # STATUS_SETTLED_FRAUD
    stats = json.loads(app.get_stats())
    assert stats["total_frauds_stopped"] == 1


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


def test_agentgrant_appeal_and_dispute_flow():
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

    # Researcher appeals with 10% bond
    mock_env.message.sender_address = researcher
    mock_env.message.value = 10**17
    app.appeal_verdict(
        grant_id=gid,
        dispute_reason="Third-party NREL calibration certifies >22.1% under standardized solar simulator."
    )

    grant_json = json.loads(app.get_grant(gid))
    assert grant_json["status"] == 7  # STATUS_DISPUTED
    assert grant_json["dispute_bond"] == str(10**17)

    # Supreme Court adjudication
    mock_env.nondet.llm_response = {
        "canary": "CANARY_AGENT_GRANT_DESCI_V1",
        "verdict": "APPEAL_UPHELD_ACCEPTED",
        "reason": "Independent NREL laboratory verification confirms 22.4% cell efficiency."
    }

    mock_env.message.sender_address = dao
    app.adjudicate_appeal(grant_id=gid, supplemental_reproduction_url="https://nrel.gov/pv/calibration/cert_9881.txt")

    final_data = json.loads(app.get_grant(gid))
    assert final_data["status"] == 4  # STATUS_SETTLED_ACCEPTED
    assert final_data["verdict"] == "MILESTONE_ACCEPTED_FULL"


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
