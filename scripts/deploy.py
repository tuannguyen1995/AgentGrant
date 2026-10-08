import sys
import os
import json
import time
from genlayer_py import create_client, studionet, create_account
from genlayer_py.types.transactions import TransactionStatus

def deploy_agent_grant():
    print("[*] Initializing deployment to GenLayer StudioNet (Chain ID: 61999)...", flush=True)
    deployer = create_account()
    print(f"Deployer Address: {deployer.address}", flush=True)

    client = create_client(chain=studionet, account=deployer)
    print("Funding deployer account with 5 GEN on StudioNet...", flush=True)
    try:
        client.fund_account(deployer.address, 5 * 10**18)
    except Exception as e:
        print(f"Notice during funding: {e}", flush=True)

    contract_path = os.path.join(os.path.dirname(__file__), "..", "contracts", "contract.py")
    with open(contract_path, "r", encoding="utf-8") as f:
        contract_code = f.read()

    print(f"Reading contract code from {contract_path} ({len(contract_code)} bytes)...", flush=True)
    print("Deploying AgentGrant Intelligent Contract...", flush=True)
    
    tx_hash = client.deploy_contract(code=contract_code)
    print(f"Deployment Transaction Hash: {tx_hash}", flush=True)
    print("Waiting for transaction receipt on StudioNet...", flush=True)

    receipt = client.wait_for_transaction_receipt(
        tx_hash,
        status=TransactionStatus.ACCEPTED,
        retries=60,
        interval=3000
    )

    print("\n--- DEPLOYMENT RECEIPT ---", flush=True)
    contract_addr = (
        receipt.get("contract_address")
        or (receipt.get("data") and receipt["data"].get("contract_address"))
        or receipt.get("recipient_address")
        or receipt.get("to")
    )
    print(f"[SUCCESS] Contract Deployed Successfully!")
    print(f"Contract Address: {contract_addr}")

    # Save to a record file
    deployment_record = {
        "network": "studionet",
        "chainId": 61999,
        "contractAddress": contract_addr,
        "txHash": tx_hash,
        "deployer": deployer.address,
    }
    out_file = os.path.join(os.path.dirname(__file__), "deployed_contract.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(deployment_record, f, indent=2)
    print(f"Saved deployment info to {out_file}", flush=True)

    # Automatically update frontend config if it exists
    config_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "src", "config", "genlayer.ts")
    if os.path.exists(config_path):
        with open(config_path, "r", encoding="utf-8") as cf:
            c_text = cf.read()
        import re
        c_text = re.sub(
            r'export const DEFAULT_CONTRACT_ADDRESS\s*=\s*".*?";',
            f'export const DEFAULT_CONTRACT_ADDRESS = "{contract_addr}";',
            c_text
        )
        with open(config_path, "w", encoding="utf-8") as cf:
            cf.write(c_text)
        print(f"[OK] Automatically updated {config_path}", flush=True)

    return contract_addr

if __name__ == "__main__":
    deploy_agent_grant()
