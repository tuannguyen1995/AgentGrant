import sys
import time
import json
from genlayer_py import create_client, studionet, create_account
from genlayer_py.types.transactions import TransactionStatus

with open("scripts/deployed_contract.json", "r") as f:
    CONTRACT_ADDRESS = json.load(f)["contractAddress"]

def seed_sample_grants():
    print(f"[*] Seeding diverse real on-chain grants into {CONTRACT_ADDRESS}...", flush=True)
    
    # 1. Accounts setup
    dao = create_account()
    client_dao = create_client(chain=studionet, account=dao)
    client_dao.fund_account(dao.address, 10 * 10**18)
    time.sleep(2)

    researcher1 = create_account()
    client_res1 = create_client(chain=studionet, account=researcher1)
    client_res1.fund_account(researcher1.address, 5 * 10**18)

    researcher2 = create_account()
    client_res2 = create_client(chain=studionet, account=researcher2)
    client_res2.fund_account(researcher2.address, 5 * 10**18)

    whistleblower = create_account()
    client_wb = create_client(chain=studionet, account=whistleblower)
    client_wb.fund_account(whistleblower.address, 5 * 10**18)
    time.sleep(2)

    paper_url = "https://raw.githubusercontent.com/tuannguyen1995/AgentGrant/main/README.md"
    data_url = "https://raw.githubusercontent.com/tuannguyen1995/AgentGrant/main/contracts/contract.py"

    # [1] Grant 1: CRISPR Off-Target Epigenetic Repair (STATUS_SUBMITTED)
    print("\n[1] Creating Grant #1: CRISPR Epigenetic Repair...", flush=True)
    tx1 = client_dao.write_contract(
        address=CONTRACT_ADDRESS,
        function_name="create_grant_milestone",
        args=["CRISPR Off-Target Epigenetic Repair In Vivo", "Require double-blind NGS sequencing with raw FASTQ counts and p < 0.01", 6000],
        value=1 * 10**18,
    )
    client_dao.wait_for_transaction_receipt(tx1, status=TransactionStatus.ACCEPTED, retries=40, interval=2000)
    
    # Researcher submits
    tx1_sub = client_res1.write_contract(
        address=CONTRACT_ADDRESS,
        function_name="submit_research_deliverable",
        args=[1, paper_url, data_url]
    )
    client_res1.wait_for_transaction_receipt(tx1_sub, status=TransactionStatus.ACCEPTED, retries=40, interval=2000)
    print("    Grant #1 created & submitted!")

    # [2] Grant 2: Ambient Superconductivity (STATUS_FROZEN_FLAGGED by Whistleblower)
    print("\n[2] Creating Grant #2: Ambient Superconductivity...", flush=True)
    tx2 = client_dao.write_contract(
        address=CONTRACT_ADDRESS,
        function_name="create_grant_milestone",
        args=["Ambient Superconductivity Carbon-Lattice Verification", "Meissner effect zero resistance verification at 295K with raw SQUID data", 6000],
        value=2 * 10**18,
    )
    client_dao.wait_for_transaction_receipt(tx2, status=TransactionStatus.ACCEPTED, retries=40, interval=2000)
    
    # Researcher submits
    tx2_sub = client_res2.write_contract(
        address=CONTRACT_ADDRESS,
        function_name="submit_research_deliverable",
        args=[2, paper_url, data_url]
    )
    client_res2.wait_for_transaction_receipt(tx2_sub, status=TransactionStatus.ACCEPTED, retries=40, interval=2000)

    # Whistleblower flags fraud & stakes 0.1 GEN bond
    print("    Whistleblower flagging fraud on Grant #2...", flush=True)
    tx2_wb = client_wb.write_contract(
        address=CONTRACT_ADDRESS,
        function_name="report_academic_fraud",
        args=[
            2,
            "https://raw.githubusercontent.com/tuannguyen1995/AgentGrant/main/SECURITY.md",
            "Whistleblower Audit: SQUID magnetometer time-series CSV rows exhibit synthetic discontinuity; p-hacking suspected."
        ],
        value=10**17 # 0.1 GEN bond
    )
    client_wb.wait_for_transaction_receipt(tx2_wb, status=TransactionStatus.ACCEPTED, retries=40, interval=2000)
    print("    Grant #2 flagged as FROZEN by whistleblower!")

    # [3] Grant 3: Quantum Dot Solar Cell (Open status for user interaction)
    print("\n[3] Creating Grant #3: Quantum Dot Enzymatic Solar Cells (Open)...", flush=True)
    tx3 = client_dao.write_contract(
        address=CONTRACT_ADDRESS,
        function_name="create_grant_milestone",
        args=["Quantum Dot Enzymatic Solar Cells (High Efficiency)", "Spectroscopy photon yield raw data exceeding 22% conversion efficiency", 6000],
        value=15 * 10**17,
    )
    client_dao.wait_for_transaction_receipt(tx3, status=TransactionStatus.ACCEPTED, retries=40, interval=2000)
    print("    Grant #3 created (Open)!")

    # Summary
    raw_grants = client_dao.read_contract(address=CONTRACT_ADDRESS, function_name="get_all_grants", args=[])
    grants = json.loads(raw_grants)
    print("\n=== ON-CHAIN GRANTS INITIALIZED ===")
    for g in grants:
        print(f"Grant #{g['grant_id']} | {g['project_title']} | Status: {g['status']} | Frozen: {g['is_frozen']} | Escrow: {g['escrow_amount']}")

if __name__ == "__main__":
    seed_sample_grants()
