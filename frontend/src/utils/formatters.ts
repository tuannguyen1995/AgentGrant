export interface ResearchGrantData {
  grant_id: number;
  grantor_dao: string;
  researcher: string;
  dispute_initiator: string;
  escrow_amount: string;
  dispute_bond: string;
  project_title: string;
  methodology_spec: string;
  preprint_url: string;
  raw_dataset_url: string;
  evidence_hash: string;
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

export const STATUS_LABELS: Record<number, { title: string; color: string; bg: string; border: string }> = {
  0: { title: "Grant Open", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  1: { title: "Deliverable Submitted", color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200" },
  2: { title: "Rebuttal Window (24 blk)", color: "text-amber-800", bg: "bg-amber-50", border: "border-amber-300" },
  3: { title: "Settled: 100% Approved", color: "text-emerald-800", bg: "bg-emerald-50", border: "border-emerald-300" },
  4: { title: "Settled: Academic Fraud", color: "text-red-800", bg: "bg-red-50", border: "border-red-300" },
  5: { title: "Settled: Partial Revision", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-300" },
  6: { title: "Appellate Disputed", color: "text-purple-800", bg: "bg-purple-50", border: "border-purple-300" },
  7: { title: "Cancelled / Reclaimed", color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-300" },
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
      return { label: "Milestone Accepted (100% Release)", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-300" };
    case "PARTIAL_REVISION_GRANT":
      return { label: "Partial Revision (50/50 Split)", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-300" };
    case "REJECTED_ACADEMIC_FRAUD":
      return { label: "Rejected: Academic Fraud", bg: "bg-red-50", text: "text-red-700", border: "border-red-300" };
    case "DISPUTED":
      return { label: "Appellate Dispute Active", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-300" };
    case "PENDING":
    default:
      return { label: "Pending Peer-Review", bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" };
  }
}
