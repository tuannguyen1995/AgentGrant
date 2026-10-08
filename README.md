# 🔬 AgentGrant: Autonomous Scientific Grant Disbursement & Peer-Review Court

> **Track:** DeSci (Decentralized Science) / Public Goods Funding / Academic Integrity  
> **Target Network:** GenLayer StudioNet (Chain ID: `61999` / `0xF22F`, RPC: `https://studio.genlayer.com/api`)  
> **Deployed Contract Address:** [`0x2A0D207835eb5e82a7CCD75F4dAf3611fd526572`](https://genlayer-explorer.vercel.app/address/0x2A0D207835eb5e82a7CCD75F4dAf3611fd526572)  
> **Live Production dApp:** [https://agentgrant-nine.vercel.app](https://agentgrant-nine.vercel.app)  
> **GitHub Repository:** [https://github.com/tuannguyen1995/AgentGrant](https://github.com/tuannguyen1995/AgentGrant)  

---

## 📖 1. The Core Problem in Scientific Funding

Decentralized science (BioDAOs, research DAOs, public goods funding foundations) issues milestone-based grants to independent laboratories and principal investigators. However, the academic evaluation layer suffers from deep systemic failures:
1. **Centralized Evaluation Bottlenecks & Bias:** Human review committees take 6–12 months to review interim milestones, introducing institutional gatekeeping and review bias.
2. **The Reproducibility Crisis:** Over 70% of researchers in life sciences and computational fields fail to reproduce another scientist's findings due to hidden parameters, closed datasets, and incomplete code.
3. **P-Hacking and Statistical Manipulation:** Selective reporting of statistical markers ($p < 0.05$) to unlock funding tranches without providing verifiable raw logs or negative controls.
4. **Why Traditional Smart Contracts Fail:** Legacy EVM blockchains cannot read academic preprint manuscripts (LaTeX/PDF on arXiv/bioRxiv) or audit empirical raw data repositories (Zenodo/OSF/GitHub) without trusted centralized oracles.

---

## 💡 2. The GenLayer Solution: AgentGrant

**AgentGrant** is an Intelligent Contract on GenLayer that turns AI validators into an autonomous peer-review court and grant disbursement arbiter:
- **Lock Grant Escrow (`create_grant_milestone`):** Funding DAOs lock GEN tokens in escrow along with verifiable methodology invariants (statistical thresholds, control group standards, replication requirements).
- **Submit Deliverables (`submit_research_deliverable`):** Principal Investigators link their public preprint manuscript and raw dataset / simulation code repository.
- **AI Peer-Review Council (`adjudicate_peer_review`):** GenLayer validators crawl preprint text and raw datasets on-chain (`gl.nondet.web.render`), computing a cryptographic SHA-256 evidence snapshot and reaching semantic consensus (`gl.vm.run_nondet`):
  - `MILESTONE_ACCEPTED_FULL` $\rightarrow$ 100% grant disbursed to researchers.
  - `PARTIAL_REVISION_GRANT` $\rightarrow$ 50% operational cost disbursed, 50% refunded to DAO.
  - `REJECTED_ACADEMIC_FRAUD` $\rightarrow$ 100% grant refunded to DAO.
- **Rebuttal Cooling-Off Window (24 Blocks):** Stakeholders can file an appeal with a 10% anti-spam dispute bond (`appeal_verdict`), triggering the Supreme Academic Council appellate court (`adjudicate_appeal`).

---

## 🏛️ 3. Contract Architecture & Functions

```
contracts/contract.py
├── create_grant_milestone(title, spec, duration)  [Payable, locks GEN escrow]
├── submit_research_deliverable(grant_id, preprint_url, raw_dataset_url)
├── adjudicate_peer_review(grant_id)               [Non-deterministic AI Jury]
├── appeal_verdict(grant_id, dispute_reason)       [Payable, 10% staked dispute bond]
├── adjudicate_appeal(grant_id, supp_url)          [Supreme Magistrate re-evaluation]
├── finalize_settlement(grant_id)                  [Executes un-disputed payout after 24 blocks]
├── cancel_or_reclaim(grant_id)                    [DAO reclaim if unfulfilled / stalled]
└── View Methods: get_grant(), get_all_grants(), get_stats()
```

### Security Invariants & Defenses:
- **Prompt Injection Defense:** Untrusted academic manuscripts and datasets are strictly isolated within `<academic_evidence>` XML tags.
- **Security Canary Verification:** Mandatory validation of `CANARY_AGENT_GRANT_DESCI_V1` in LLM output.
- **Semantic Validator Comparison:** Validator nodes verify that `mine["verdict"] == leader["verdict"]` and `mine["evidence_hash"] == leader["evidence_hash"]`.
- **Double-Payout Protection:** Escrow state is zeroed before native transfers: `g.escrow_amount = bigint(0)`.

---

## 🧪 4. Test Suite Execution

AgentGrant includes a 100% passing test suite covering the full grant lifecycle, fraud rejection, rebuttal disputes, and role security:

```bash
# Run pytest test suite
pytest tests/test_agentgrant.py -v
```

Output:
```
tests/test_agentgrant.py::test_agentgrant_milestone_accepted_lifecycle PASSED
tests/test_agentgrant.py::test_agentgrant_academic_fraud_rejection PASSED
tests/test_agentgrant.py::test_agentgrant_appeal_and_dispute_flow PASSED
tests/test_agentgrant.py::test_agentgrant_role_violations_and_edge_cases PASSED
============================== 4 passed in 0.13s ==============================
```

---

## 🎨 5. Frontend Open Science Console

Built with React 18, Vite, TypeScript, and TailwindCSS:
- **Color System:** Scientific Paper Light (`#F8FAFC`), Academic Indigo (`#4338CA`), Reproducible Emerald (`#059669`), Revision Amber (`#D97706`), Retraction Crimson (`#DC2626`).
- **Typography:** Space Grotesk (headers), JetBrains Mono (metrics & hashes), Inter (body).
- **Features:**
  - MetaMask automatic network switch to GenLayer StudioNet (`61999`).
  - StudioNet faucet 1-click funding request.
  - Interactive grant cards with live academic rigor gauges and empirical reproducibility scores.
  - Forensic peer-review inspector modal displaying validator critiques and SHA-256 evidence snapshots.
  - Rebuttal dispute portal with 10% bonded appeal stakes.

### Running Frontend Locally:
```bash
cd frontend
npm install
npm run dev
```

---

## 🚀 6. On-Chain Deployment Info

- **Network:** GenLayer StudioNet (Chain ID: `61999` / `0xF22F`)
- **RPC URL:** `https://studio.genlayer.com/api`
- **Contract Address:** `0x2A0D207835eb5e82a7CCD75F4dAf3611fd526572`
- **Explorer URL:** [https://genlayer-explorer.vercel.app/address/0x2A0D207835eb5e82a7CCD75F4dAf3611fd526572](https://genlayer-explorer.vercel.app/address/0x2A0D207835eb5e82a7CCD75F4dAf3611fd526572)
- **Deployment Transaction:** `0x0d69d1946b82a2df25b4e2ee87d91949b87f4e8905f1ca23631f504c9a85f1c0`
