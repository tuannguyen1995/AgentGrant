# 📜 Changelog: AgentGrant

All notable changes to the AgentGrant protocol and dApp will be documented in this file.

## [1.0.0] - 2026-10-08

### Added
- **Intelligent Contract Core (`contracts/contract.py`):**
  - Full milestone lifecycle management (`create_grant_milestone`, `submit_research_deliverable`).
  - Decentralized AI Peer-Review Council (`adjudicate_peer_review`) with dual web-scraping for preprint manuscripts and raw dataset repositories (`gl.nondet.web.render`).
  - Semantic consensus validation comparing peer-review verdict and cryptographic evidence hash (`gl.vm.run_nondet`).
  - Statistical analysis and empirical reproducibility scoring (0-100% scale).
  - P-hacking and academic fraud rejection detection logic.
  - 24-block rebuttal cooling-off window with 10% staked dispute bond.
  - Supreme Academic Council appellate court (`appeal_verdict`, `adjudicate_appeal`).
  - Double-payout defense: immediate escrow zeroing before native transfers.
  - Emergency timeout reclaim for stalled grant evaluations (>150 blocks).
- **Test Suite (`tests/test_agentgrant.py`):**
  - 4 comprehensive unit and integration tests passing with 100% success rate.
  - Full lifecycle test for full acceptance (`MILESTONE_ACCEPTED_FULL`).
  - Academic fraud rejection test (`REJECTED_ACADEMIC_FRAUD`).
  - Rebuttal dispute and appellate court test (`STATUS_DISPUTED` -> `APPEAL_UPHELD_ACCEPTED`).
  - Role violation and edge case security assertions.
- **Frontend Open Science Peer-Review Console (`frontend/`):**
  - Built with React 18, Vite, TypeScript, TailwindCSS, `genlayer-js`, and `lucide-react`.
  - Brand design system: Scientific Paper Light (`#F8FAFC`), Academic Indigo (`#4338CA`), Reproducible Emerald (`#059669`), Revision Amber (`#D97706`), Retraction Crimson (`#DC2626`).
  - `Navbar.tsx`: Auto MetaMask network switch to GenLayer StudioNet (Chain 61999, Hex `0xF22F`), balance display, and Studio faucet request helper.
  - `StatsOverview.tsx`: Real-time aggregated metrics for Escrow Locked, Disbursed Grants, Academic Rigor, and Reproducibility.
  - `CreateGrantModal.tsx`: DAO milestone creation with custom methodology specifications.
  - `GrantCard.tsx`: Interactive grant card with rigor gauges, evidence hashes, and state-adaptive action buttons.
  - `SubmitDeliverableModal.tsx`: Principal Investigator portal to claim and link live arXiv/bioRxiv manuscripts and Zenodo/OSF datasets.
  - `PeerReviewInspectorModal.tsx`: Complete forensic inspection modal for AI peer-review critiques, cryptographic snapshots, and security canary verification.
  - `AppealModal.tsx`: Dual-mode modal for filing 10% bonded rebuttal appeals and executing Supreme Court replication adjudications.
- **Deployment & Seeding:**
  - Deployed on GenLayer StudioNet at `0x2A0D207835eb5e82a7CCD75F4dAf3611fd526572`.
  - Automated seeding script (`scripts/seed_grants.py`) populated live on-chain grants.
