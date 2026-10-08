# 🏛️ Architecture Specification: AgentGrant (Autonomous Scientific Grant Disbursement & Peer-Review Court)

## 1. Executive Summary

**AgentGrant** is an autonomous peer-review court and milestone disbursement protocol designed for **DeSci (Decentralized Science)**, BioDAOs, and academic public goods funding.

Traditional scientific grant distribution suffers from:
1. **Centralized evaluation bottlenecks:** Human committees take 6–12 months to review interim milestones.
2. **Reproducibility crisis:** Up to 70% of researchers in biology and psychology have failed to reproduce another scientist's experiments.
3. **P-hacking and data fabrication:** Biased statistical manipulation ($p < 0.05$ threshold manipulation) and omitted raw datasets.
4. **Smart contract limitations:** Legacy EVM blockchains cannot read academic preprints (LaTeX/PDF manuscripts on arXiv/bioRxiv) or audit empirical data repositories (Zenodo/OSF/GitHub) without trusted centralized oracles.

**The AgentGrant Solution on GenLayer:**
AgentGrant leverages GenLayer's Intelligent Contract architecture to directly crawl academic preprints and raw simulation datasets on-chain (`gl.nondet.web.render`), convening a decentralized jury of AI validators (`gl.vm.run_nondet`) to evaluate methodology rigor and empirical reproducibility before disbursing locked milestone funds.

---

## 2. Protocol Workflow & Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor DAO as Funding DAO / Foundation
    actor PI as Principal Investigator (Researcher)
    actor GL as GenLayer AI Validators
    actor SC as AgentGrant Intelligent Contract

    DAO->>SC: create_grant_milestone(title, spec, duration) + [Locks Escrow]
    Note over SC: Status: STATUS_GRANT_OPEN (0)

    PI->>SC: submit_research_deliverable(preprint_url, raw_dataset_url)
    Note over SC: Status: STATUS_SUBMITTED (1)

    DAO->>SC: adjudicate_peer_review(grant_id)
    SC->>GL: gl.vm.run_nondet (Crawl Web + LLM Review)
    GL->>GL: Crawl Preprint & Raw Dataset
    GL->>GL: Check p-hacking, controls, variance
    GL->>GL: Validator Semantic Agreement (Verdict & Hash Match)
    GL-->>SC: Verdict: MILESTONE_ACCEPTED_FULL / PARTIAL / FRAUD
    Note over SC: Status: STATUS_AWAITING_PAYOUT (2)<br/>Audit Block Recorded

    rect rgb(240, 248, 255)
        Note over DAO, PI: 24-Block Rebuttal Cooling-Off Challenge Window
        alt Rebuttal Appeal Filed (within 24 blocks)
            PI->>SC: appeal_verdict(reason) + [Stakes 10% Bond]
            Note over SC: Status: STATUS_DISPUTED (6)
            DAO->>SC: adjudicate_appeal(supplemental_reproduction_url)
            SC->>GL: Supreme Magistrate LLM Adjudication
            GL-->>SC: APPEAL_UPHELD_ACCEPTED / PARTIAL / DISMISSED
        else No Dispute (after 24 blocks)
            DAO->>SC: finalize_settlement(grant_id)
        end
    end

    Note over SC: Status: SETTLED (3, 4, or 5)<br/>Native GEN disbursed or refunded
```

---

## 3. Intelligent Contract State Machine

```mermaid
stateDiagram-v2
    [*] --> STATUS_GRANT_OPEN: create_grant_milestone (DAO locks GEN)
    STATUS_GRANT_OPEN --> STATUS_SUBMITTED: submit_research_deliverable (PI submits URLs)
    STATUS_GRANT_OPEN --> STATUS_CANCELLED: cancel_or_reclaim (Expired unclaimed)
    
    STATUS_SUBMITTED --> STATUS_AWAITING_PAYOUT: adjudicate_peer_review (AI consensus reached)
    STATUS_SUBMITTED --> STATUS_CANCELLED: cancel_or_reclaim (Stalled > 150 blocks)
    
    STATUS_AWAITING_PAYOUT --> STATUS_DISPUTED: appeal_verdict (10% bond within 24 blocks)
    STATUS_AWAITING_PAYOUT --> STATUS_SETTLED_ACCEPTED: finalize_settlement (Full approval payout)
    STATUS_AWAITING_PAYOUT --> STATUS_SETTLED_PARTIAL: finalize_settlement (50/50 split payout)
    STATUS_AWAITING_PAYOUT --> STATUS_SETTLED_FRAUD: finalize_settlement (100% refund to DAO)
    
    STATUS_DISPUTED --> STATUS_SETTLED_ACCEPTED: adjudicate_appeal (Appeal Upheld)
    STATUS_DISPUTED --> STATUS_SETTLED_PARTIAL: adjudicate_appeal (Appeal Upheld Partial)
    STATUS_DISPUTED --> STATUS_SETTLED_FRAUD: adjudicate_appeal (Appeal Dismissed)
    
    STATUS_SETTLED_ACCEPTED --> [*]
    STATUS_SETTLED_PARTIAL --> [*]
    STATUS_SETTLED_FRAUD --> [*]
    STATUS_CANCELLED --> [*]
```

---

## 4. Key Architectural Mechanisms

### 4.1 Non-Deterministic Semantic Consensus (`gl.vm.run_nondet`)
The consensus mechanism does not compare loose formatting or JSON stringification. It strictly compares the **semantic meaning**:
```python
def validator_fn(leader_res) -> bool:
    if not isinstance(leader_res, gl.vm.Return):
        return False
    leader = leader_res.calldata
    mine = leader_fn()
    # Semantic verification:
    if mine["verdict"] != leader["verdict"]:
        return False
    if leader.get("evidence_hash") != mine.get("evidence_hash"):
        return False
    return True
```

### 4.2 Prompt Injection & Security Canary Defense
All untrusted web payloads scraped from preprints and data repositories are enclosed inside `<academic_evidence>` tags and neutralized. Furthermore, the consensus algorithm enforces a dynamic security canary token:
```python
CANARY_TOKEN = "CANARY_AGENT_GRANT_DESCI_V1"
```
If an adversary attempts prompt hijacking, the canary check fails and triggers an automatic validation rejection.

### 4.3 Rebuttal Cooling-Off Challenge Window (24 Blocks)
To prevent flash liquidations and allow due process, settlements cannot execute instantly. Stakeholders have a 24-block window to file an appeal with a 10% anti-sybil dispute bond. If the appeal is upheld, the bond is returned in full; if dismissed as frivolous, the bond is forfeited to the counterparty.

### 4.4 Double-Payout Defense & Reentrancy Safety
Before emitting native transfers, the contract resets the state storage:
```python
escrow_val = g.escrow_amount
g.escrow_amount = bigint(0)  # Double payout protection
self.total_grant_locked = self.total_grant_locked - escrow_val
_pay_native(recipient, escrow_val)
```
