import sys
import time
import json
from genlayer_py import create_client, studionet, create_account
from genlayer_py.types.transactions import TransactionStatus

CONTRACT_ADDRESS = "0x2A0D207835eb5e82a7CCD75F4dAf3611fd526572"

def seed_sample_grants():
    print(f"[*] Seeding real scientific research grants on-chain into {CONTRACT_ADDRESS}...", flush=True)
    
    # DAO / Grantor account
    dao = create_account()
    client_dao = create_client(chain=studionet, account=dao)
    print(f"DAO Account: {dao.address}. Funding 5 GEN...")
    client_dao.fund_account(dao.address, 5 * 10**18)
    time.sleep(2)

    # Researcher accounts
    researcher1 = create_account()
    client_res1 = create_client(chain=studionet, account=researcher1)
    client_res1.fund_account(researcher1.address, 5 * 10**18)

    researcher2 = create_account()
    client_res2 = create_client(chain=studionet, account=researcher2)
    client_res2.fund_account(researcher2.address, 5 * 10**18)
    time.sleep(2)

    # 1. Grant #1: CRISPR Epigenetic Repair (Will be submitted and peer-reviewed)
    print("\n[1] Creating Grant #1: CRISPR Off-Target Epigenetic Repair...", flush=True)
    tx1 = client_dao.write_contract(
        address=CONTRACT_ADDRESS,
        function_name="create_grant_milestone",
        args=[
            "CRISPR Off-Target Epigenetic Repair In Vivo",
            "Require double-blind NGS sequencing with raw FASTQ counts and p < 0.01 across 480 biological replicates",
            6000
        ],
        value=1 * 10**18,
    )
    r1 = client_dao.wait_for_transaction_receipt(tx1, status=TransactionStatus.ACCEPTED, retries=40, interval=2000)
    print(f"    Grant #1 created on-chain! Tx: {tx1}")

    # 2. Grant #2: Room-Temp Superconductor (Will be submitted)
    print("\n[2] Creating Grant #2: Ambient Superconductivity Carbon-Lattice...", flush=True)
    tx2 = client_dao.write_contract(
        address=CONTRACT_ADDRESS,
        function_name="create_grant_milestone",
        args=[
            "Ambient Superconductivity Carbon-Lattice Verification",
            "Meissner effect zero resistance verification at 295K with raw SQUID magnetometer time-series CSV data",
            6000
        ],
        value=2 * 10**18,
    )
    r2 = client_dao.wait_for_transaction_receipt(tx2, status=TransactionStatus.ACCEPTED, retries=40, interval=2000)
    print(f"    Grant #2 created on-chain! Tx: {tx2}")

    # 3. Grant #3: Solid State Battery (Open status for interactive testing)
    print("\n[3] Creating Grant #3: Solid-State Polymer-Ceramic Electrolyte...", flush=True)
    tx3 = client_dao.write_contract(
        address=CONTRACT_ADDRESS,
        function_name="create_grant_milestone",
        args=[
            "Solid-State Polymer-Ceramic Lithium Dendrite Suppression",
            "EIS impedance spectroscopy logs over 1000 fast-charge cycles at 4C rate with raw Nyquist data points",
            6000
        ],
        value=15 * 10**17,  # 1.5 GEN
    )
    r3 = client_dao.wait_for_transaction_receipt(tx3, status=TransactionStatus.ACCEPTED, retries=40, interval=2000)
    print(f"    Grant #3 created on-chain! Tx: {tx3}")

    # Submit deliverable for Grant #1
    print("\n[4] Researcher submitting preprint & raw dataset for Grant #1...", flush=True)
    paper1 = "https://raw.githubusercontent.com/tuannguyen1995/AgentGrant/main/README.md"
    data1 = "https://raw.githubusercontent.com/tuannguyen1995/AgentGrant/main/contracts/contract.py"
    tx_sub1 = client_res1.write_contract(
        address=CONTRACT_ADDRESS,
        function_name="submit_research_deliverable",
        args=[1, paper1, data1]
    )
    client_res1.wait_for_transaction_receipt(tx_sub1, status=TransactionStatus.ACCEPTED, retries=40, interval=2000)
    print("    Grant #1 deliverable submitted successfully!")

    # Submit deliverable for Grant #2
    print("\n[5] Researcher submitting deliverable for Grant #2...", flush=True)
    tx_sub2 = client_res2.write_contract(
        address=CONTRACT_ADDRESS,
        function_name="submit_research_deliverable",
        args=[2, paper1, data1]
    )
    client_res2.wait_for_transaction_receipt(tx_sub2, status=TransactionStatus.ACCEPTED, retries=40, interval=2000)
    print("    Grant #2 deliverable submitted successfully!")

    # Check state on-chain
    raw_grants = client_dao.read_contract(address=CONTRACT_ADDRESS, function_name="get_all_grants", args=[])
    grants = json.loads(raw_grants)
    print("\n=== ON-CHAIN GRANTS INITIALIZED ===")
    for g in grants:
        print(f"Grant #{g['grant_id']} | {g['project_title']} | Status: {g['status']} | Escrow: {g['escrow_amount']}")

if __name__ == "__main__":
    seed_sample_grants()
