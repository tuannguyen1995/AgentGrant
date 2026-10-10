import pytest
import json
import os
import sys

# Ensure contracts directory is reachable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "contracts")))
from test_agentgrant import setup_gl_mock, SimulatedAddress


def test_cooling_off_and_finalize_settlement_reverts_early():
    """Verifies that settlement cannot be finalized while 24-block cooling window is active."""
    mock_env = setup_gl_mock()
    import contract
    contract.gl = mock_env

    app = contract.Contract()
    dao = SimulatedAddress("0x1111111111111111111111111111111111111111")
    researcher = SimulatedAddress("0x2222222222222222222222222222222222222222")

    mock_env.message.sender_address = dao
    mock_env.message.value = 1000
    grant_id = app.create_grant_milestone(
        project_title="Cancer Genome Mapping",
        methodology_spec="Strict statistical rigor p < 0.01",
        duration_blocks=6000
    )

    mock_env.message.sender_address = researcher
    mock_env.message.value = 0
    app.submit_research_deliverable(
        grant_id=grant_id,
        preprint_url="https://example.com/paper",
        raw_dataset_url="https://example.com/data"
    )

    # AI Adjudicates -> status 3 (STATUS_AWAITING_PAYOUT)
    mock_env.message.sender_address = dao
    app.adjudicate_peer_review(grant_id=grant_id)

    grant_json = json.loads(app.get_grant(grant_id))
    assert grant_json["status"] == 3

    # Reverts if finalized immediately (before 24 blocks elapsed)
    with pytest.raises(Exception, match="Rebuttal cooling-off challenge window is still active"):
        app.finalize_settlement(grant_id=grant_id)

    # Advance clock past 24 blocks -> settlement succeeds
    mock_env.advance_blocks(30)
    app.finalize_settlement(grant_id=grant_id)
    final_json = json.loads(app.get_grant(grant_id))
    assert final_json["status"] == 4  # STATUS_SETTLED_ACCEPTED


def test_appellate_evidence_restricted_to_bonded_appellant():
    """Verifies that only the bonded appellant can provide or update appellate evidence."""
    mock_env = setup_gl_mock()
    import contract
    contract.gl = mock_env

    app = contract.Contract()
    dao = SimulatedAddress("0x1111111111111111111111111111111111111111")
    researcher = SimulatedAddress("0x2222222222222222222222222222222222222222")
    stranger = SimulatedAddress("0x9999999999999999999999999999999999999999")

    mock_env.message.sender_address = dao
    mock_env.message.value = 1000
    grant_id = app.create_grant_milestone(
        project_title="DeSci Drug Discovery Model",
        methodology_spec="Methodology invariants validation",
        duration_blocks=6000
    )

    mock_env.message.sender_address = researcher
    app.submit_research_deliverable(
        grant_id=grant_id,
        preprint_url="https://example.com/paper",
        raw_dataset_url="https://example.com/data"
    )

    mock_env.message.sender_address = dao
    app.adjudicate_peer_review(grant_id=grant_id)

    # Researcher appeals with 10% bond
    mock_env.message.sender_address = researcher
    mock_env.message.value = 100
    app.appeal_verdict(
        grant_id=grant_id,
        dispute_reason="Replication claims valid and confirmed",
        supplemental_reproduction_url="https://example.com/appeal_proof"
    )

    # Stranger tries to update appeal evidence -> Must REVERT
    mock_env.message.sender_address = stranger
    with pytest.raises(Exception, match="Permission Denied: Only the bonded appellant can provide or update appellate evidence"):
        app.adjudicate_appeal(
            grant_id=grant_id,
            supplemental_reproduction_url="https://evil.com/fake_proof"
        )


def test_dismissed_appeal_preserves_and_settles_prior_result_both_appellants():
    """
    Verifies that dismissed appeals preserve prior result and route bond to counterparty:
    1. Researcher appeals fraud verdict -> dismissed -> DAO gets refund + dispute bond.
    2. DAO appeals accepted verdict -> dismissed -> Researcher gets escrow + dispute bond.
    """
    mock_env = setup_gl_mock()
    import contract
    contract.gl = mock_env

    # 1. Researcher appeals rejected fraud verdict
    app = contract.Contract()
    dao = SimulatedAddress("0x1111111111111111111111111111111111111111")
    researcher = SimulatedAddress("0x2222222222222222222222222222222222222222")

    mock_env.message.sender_address = dao
    mock_env.message.value = 1000
    gid1 = app.create_grant_milestone("Target Validation", "Biochem kinetics invariants", 6000)

    mock_env.message.sender_address = researcher
    app.submit_research_deliverable(gid1, "https://paper.org/target", "https://data.org/kinetics")

    mock_env.nondet.llm_response = {
        "canary": "CANARY_AGENT_GRANT_DESCI_V1",
        "verdict": "REJECTED_ACADEMIC_FRAUD",
        "confidence": 99,
        "rigor_score": 10,
        "reproducibility_pct": 5,
        "reason": "Synthetic assay curves detected."
    }
    mock_env.message.sender_address = dao
    app.adjudicate_peer_review(grant_id=gid1)

    mock_env.message.sender_address = researcher
    mock_env.message.value = 100
    app.appeal_verdict(gid1, "Independent re-testing confirms kinetics curve.", "https://nrel.gov/cert.txt")

    mock_env.nondet.llm_response = {
        "canary": "CANARY_AGENT_GRANT_DESCI_V1",
        "verdict": "APPEAL_DISMISSED",
        "reason": "Re-testing affirms irreproducibility."
    }
    mock_env.message.sender_address = dao
    app.adjudicate_appeal(grant_id=gid1)

    g1_data = json.loads(app.get_grant(gid1))
    assert g1_data["status"] == 5  # STATUS_SETTLED_FRAUD
    assert g1_data["verdict"] == "REJECTED_ACADEMIC_FRAUD"
    # DAO received 1000 escrow refund + 100 dispute bond
    dao_transfers = mock_env.get_contract_at(dao).transfers
    assert any(t["value"] == 1000 for t in dao_transfers)
    assert any(t["value"] == 100 for t in dao_transfers)

    # 2. DAO appeals accepted milestone
    mock_env.message.sender_address = dao
    mock_env.message.value = 2000
    gid2 = app.create_grant_milestone("Proteomics Assay", "Mass spec invariants verification", 6000)

    mock_env.message.sender_address = researcher
    app.submit_research_deliverable(gid2, "https://paper.org/proteomics", "https://data.org/raw_ms")

    mock_env.nondet.llm_response = {
        "canary": "CANARY_AGENT_GRANT_DESCI_V1",
        "verdict": "MILESTONE_ACCEPTED_FULL",
        "confidence": 95,
        "rigor_score": 90,
        "reproducibility_pct": 92,
        "reason": "Mass spec verified."
    }
    mock_env.message.sender_address = dao
    app.adjudicate_peer_review(grant_id=gid2)

    # DAO appeals
    mock_env.message.sender_address = dao
    mock_env.message.value = 200
    app.appeal_verdict(gid2, "Re-verifying calibration tolerance.", "https://lab.org/calibration.txt")

    # Dismissed -> Researcher gets escrow + dispute bond
    mock_env.nondet.llm_response = {
        "canary": "CANARY_AGENT_GRANT_DESCI_V1",
        "verdict": "APPEAL_DISMISSED",
        "reason": "Tolerance confirmed within standard deviation."
    }
    mock_env.message.sender_address = researcher
    app.adjudicate_appeal(grant_id=gid2)

    g2_data = json.loads(app.get_grant(gid2))
    assert g2_data["status"] == 4  # STATUS_SETTLED_ACCEPTED
    assert g2_data["verdict"] == "MILESTONE_ACCEPTED_FULL"
    res_transfers = mock_env.get_contract_at(researcher).transfers
    assert any(t["value"] == 2000 for t in res_transfers)
    assert any(t["value"] == 200 for t in res_transfers)


def test_cancel_or_reclaim_lifecycle_action():
    """Verifies DAO can cancel an unclaimed grant milestone after duration expires."""
    mock_env = setup_gl_mock()
    import contract
    contract.gl = mock_env

    app = contract.Contract()
    dao = SimulatedAddress("0x1111111111111111111111111111111111111111")

    mock_env.message.sender_address = dao
    mock_env.message.value = 1000
    grant_id = app.create_grant_milestone(
        project_title="Unclaimed Open Quantum Grant",
        methodology_spec="Methodology spec standards",
        duration_blocks=100
    )

    # Cannot cancel before expiration
    with pytest.raises(Exception, match="Cannot cancel: Grant milestone duration has not expired"):
        app.cancel_or_reclaim(grant_id=grant_id)

    # Advance clock past duration
    mock_env.advance_blocks(110)

    # Reclaim milestone
    app.cancel_or_reclaim(grant_id=grant_id)
    grant_data = json.loads(app.get_grant(grant_id=grant_id))
    assert grant_data["status"] == 8  # STATUS_CANCELLED
    assert grant_data["verdict"] == "CANCELLED"
    assert app.total_grant_locked == 0
    dao_transfers = mock_env.get_contract_at(dao).transfers
    assert any(t["value"] == 1000 for t in dao_transfers)
