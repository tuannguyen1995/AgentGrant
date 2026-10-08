# 🛡️ Security Policy & Threat Model: AgentGrant

## Overview
AgentGrant is an autonomous decentralized science (DeSci) grant escrow and arbitration protocol deployed on GenLayer StudioNet. This document defines the threat vector analysis, mitigation mechanisms, and security invariants implemented in the Intelligent Contract and dApp frontend.

---

## 1. Threat Vectors & Mitigations

| Threat Vector | Potential Impact | Implemented Mitigation |
|---|---|---|
| **Prompt Injection via Academic Manuscripts** | Attacker injects malicious prompts into preprint text or dataset CSV to force an automatic `MILESTONE_ACCEPTED_FULL` verdict. | 1. Input text is encapsulated in `<academic_evidence>` XML tags treated as untrusted.<br/>2. Mandatory `CANARY_AGENT_GRANT_DESCI_V1` security token validation.<br/>3. Semantic consensus across independent validator nodes. |
| **Reentrancy / Double-Claiming Escrow** | Malicious contract reenters during native value transfer to drain contract balance. | 1. Strict state update before transfer: `g.escrow_amount = bigint(0)` is set immediately before `emit_transfer`.<br/>2. State machine transitions to finalized settlement. |
| **Self-Funding / Role Violations** | Grantor DAO claims their own grant to manipulate peer-review and bypass scrutiny. | Strict check `_addr_str(sender) == _addr_str(g.grantor_dao)` with explicit `UserError` revert. |
| **Griefing Appeals (Denial of Settlement)** | Malicious actor repeatedly challenges valid verdicts to delay milestone payout. | 1. 24-block maximum challenge window.<br/>2. Mandatory 10% staked bond: if appeal is dismissed, bond is forfeited to counterparty.<br/>3. Rebuttal justification must be >= 10 characters. |
| **Dead/Unreachable URLs & 404 Attacks** | Researcher submits nonexistent preprint URL or corrupted server link. | Safe `try/except` around `gl.nondet.web.render`. Unreachable manuscripts trigger an immediate `REJECTED_ACADEMIC_FRAUD` fallback verdict, preserving DAO funds. |
| **Premature Fund Reclamation** | DAO attempts to cancel grant while researcher is actively submitting or undergoing peer review. | Time-locked protection: Grant cannot be cancelled if duration has not expired, and cannot be reclaimed under review unless stalled > 150 blocks. |

---

## 2. Invariant Properties

1. **Conservation of Escrow:**
   $$\sum \text{Locked Escrows} = \text{Contract Native GEN Balance}$$
2. **Dispute Bond Solvency:**
   $$\text{Settling Payout} = \text{Escrow Amount} + \text{Dispute Bond}$$
3. **No Unfunded Grants:**
   $$\text{Escrow Amount} > 0 \quad \text{required for grant creation}$$

---

## 3. Reporting Security Issues
To report a critical vulnerability, please create an issue or contact the team through the official GenLayer Portal.
