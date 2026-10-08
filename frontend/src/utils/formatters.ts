export interface ResearchGrantData {
  grant_id: number;
  grantor_dao: string;
  researcher: string;
  dispute_initiator: string;
  whistleblower: string;
  escrow_amount: string;
  dispute_bond: string;
  whistleblower_bond: string;
  project_title: string;
  methodology_spec: string;
  preprint_url: string;
  raw_dataset_url: string;
  fraud_evidence_url: string;
  fraud_allegation: string;
  evidence_hash: string;
  is_frozen: boolean;
  frozen_by: string;
  status: number;
  verdict: string;
  reason: string;
  confidence: number;
  rigor_score: number;
  reproducibility_pct: number;
  created_at_block: string;
  expires_at_block: string;
  audit_completed_block: string;
}

export type UserRole = 'dao' | 'researcher' | 'whistleblower' | 'magistrate';

export const ROLE_DEFINITIONS: Record<UserRole, { title: string; badge: string; color: string; desc: string; icon: string }> = {
  dao: {
    title: "Grantor DAO / Foundation",
    badge: "DAO Sponsor",
    color: "from-blue-600 to-indigo-600 text-blue-100 border-blue-400/40",
    desc: "Create milestone escrow, set methodology invariants, emergency freeze anomalous grants, or finalize disbursements.",
    icon: "🏛️"
  },
  researcher: {
    title: "Lead Researcher / PI",
    badge: "Principal Investigator",
    color: "from-cyan-600 to-teal-600 text-cyan-100 border-cyan-400/40",
    desc: "Claim open grants, submit arXiv/bioRxiv manuscripts & raw dataset repositories, and appeal wrongful fraud rulings.",
    icon: "🔬"
  },
  whistleblower: {
    title: "Fraud Whistleblower / Auditor",
    badge: "Scientific Auditor",
    color: "from-amber-600 to-orange-600 text-amber-100 border-amber-400/40",
    desc: "Blow the whistle on p-hacking, fabricated variance, missing control groups, or plagiarism. Stake 5% bond and earn fraud bounty upon validation.",
    icon: "🕵️"
  },
  magistrate: {
    title: "AI Court Magistrate / Consensus Node",
    badge: "AI Peer-Review Council",
    color: "from-purple-600 to-pink-600 text-purple-100 border-purple-400/40",
    desc: "Trigger decentralized AI peer-review consensus on GenLayer, cross-referencing preprint evidence and whistleblower audits.",
    icon: "⚖️"
  }
};

export const STATUS_LABELS: Record<number, { title: string; color: string; bg: string; border: string; glow: string }> = {
  0: { title: "Grant Open", color: "text-cyan-400", bg: "bg-cyan-950/40", border: "border-cyan-500/30", glow: "shadow-cyan-500/20" },
  1: { title: "Deliverables Submitted", color: "text-blue-400", bg: "bg-blue-950/40", border: "border-blue-500/30", glow: "shadow-blue-500/20" },
  2: { title: "Quarantine / Frozen Flagged", color: "text-red-400", bg: "bg-red-950/50", border: "border-red-500/50", glow: "shadow-red-500/30 animate-pulse" },
  3: { title: "Rebuttal Window (24 blk)", color: "text-amber-400", bg: "bg-amber-950/40", border: "border-amber-500/40", glow: "shadow-amber-500/20" },
  4: { title: "100% Milestone Approved", color: "text-emerald-400", bg: "bg-emerald-950/40", border: "border-emerald-500/40", glow: "shadow-emerald-500/20" },
  5: { title: "Academic Fraud Confirmed", color: "text-rose-400", bg: "bg-rose-950/50", border: "border-rose-500/50", glow: "shadow-rose-500/30" },
  6: { title: "Partial Revision (50/50)", color: "text-yellow-400", bg: "bg-yellow-950/40", border: "border-yellow-500/40", glow: "shadow-yellow-500/20" },
  7: { title: "Supreme Court Disputed", color: "text-purple-400", bg: "bg-purple-950/40", border: "border-purple-500/40", glow: "shadow-purple-500/20" },
  8: { title: "Cancelled / Reclaimed", color: "text-slate-400", bg: "bg-slate-900/60", border: "border-slate-700/50", glow: "shadow-none" },
};

export function formatAddress(addr?: string): string {
  if (!addr || addr === "0x0000000000000000000000000000000000000000") return "Unassigned / Open";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function formatGEN(valWei?: string | number | bigint): string {
  if (!valWei) return "0.00";
  try {
    const num = Number(BigInt(valWei.toString())) / 1e18;
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  } catch {
    return "0.00";
  }
}

export function getVerdictBadge(verdict: string): { label: string; bg: string; text: string; border: string } {
  switch (verdict) {
    case "MILESTONE_ACCEPTED_FULL":
      return { label: "Milestone Accepted (100% Release)", bg: "bg-emerald-950/60", text: "text-emerald-300", border: "border-emerald-500/40" };
    case "PARTIAL_REVISION_GRANT":
      return { label: "Partial Revision (50/50 Split)", bg: "bg-amber-950/60", text: "text-amber-300", border: "border-amber-500/40" };
    case "REJECTED_ACADEMIC_FRAUD":
      return { label: "Rejected: Academic Fraud Detected", bg: "bg-red-950/60", text: "text-red-300", border: "border-red-500/40" };
    case "DISPUTED":
      return { label: "Appellate Dispute Active", bg: "bg-purple-950/60", text: "text-purple-300", border: "border-purple-500/40" };
    case "PENDING":
    default:
      return { label: "Awaiting Peer-Review", bg: "bg-slate-900/60", text: "text-slate-400", border: "border-slate-700/40" };
  }
}
