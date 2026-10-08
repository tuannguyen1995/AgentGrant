import React from 'react';
import {
  FileText,
  ExternalLink,
  ShieldAlert,
  CheckCircle,
  Clock,
  Scale,
  BrainCircuit,
  Hash,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import {
  ResearchGrantData,
  STATUS_LABELS,
  formatAddress,
  formatGEN,
  getVerdictBadge
} from '../utils/formatters';

interface GrantCardProps {
  grant: ResearchGrantData;
  account: string;
  onOpenSubmit: (grant: ResearchGrantData) => void;
  onOpenAdjudicate: (grantId: number) => void;
  onOpenInspector: (grant: ResearchGrantData) => void;
  onOpenAppeal: (grant: ResearchGrantData) => void;
  onOpenAdjudicateAppeal: (grant: ResearchGrantData) => void;
  onFinalizeSettlement: (grantId: number) => void;
  onCancelOrReclaim: (grantId: number) => void;
  isActionLoading: boolean;
}

export const GrantCard: React.FC<GrantCardProps> = ({
  grant,
  account,
  onOpenSubmit,
  onOpenAdjudicate,
  onOpenInspector,
  onOpenAppeal,
  onOpenAdjudicateAppeal,
  onFinalizeSettlement,
  onCancelOrReclaim,
  isActionLoading,
}) => {
  const statusInfo = STATUS_LABELS[grant.status] || STATUS_LABELS[0];
  const verdictInfo = getVerdictBadge(grant.verdict);
  const isGrantor = account && account.toLowerCase() === grant.grantor_dao.toLowerCase();
  const isResearcher = account && account.toLowerCase() === grant.researcher.toLowerCase();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition duration-200 overflow-hidden flex flex-col justify-between">
      
      {/* Top Header Card */}
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-mono text-xs font-bold border border-slate-200">
              #{grant.grant_id}
            </span>
            <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}>
              {statusInfo.title}
            </span>
          </div>

          <div className="text-right">
            <div className="text-lg font-bold font-mono text-indigo-700">
              {formatGEN(grant.escrow_amount)} GEN
            </div>
            <div className="text-[11px] text-slate-400">Milestone Escrow</div>
          </div>
        </div>

        {/* Project Title */}
        <h3 className="text-lg font-bold font-display text-slate-900 leading-snug mb-2 hover:text-indigo-600 transition">
          {grant.project_title}
        </h3>

        {/* Methodology Spec Invariants */}
        <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 mb-4 text-xs text-slate-600">
          <span className="font-semibold text-slate-800 block mb-1">Methodology Invariants & Criteria:</span>
          <p className="line-clamp-2 italic">{grant.methodology_spec}</p>
        </div>

        {/* Deliverables / Preprints links if submitted */}
        {grant.status >= 1 && (grant.preprint_url || grant.raw_dataset_url) && (
          <div className="space-y-1.5 mb-4 text-xs">
            {grant.preprint_url && (
              <div className="flex items-center space-x-2 text-slate-600 truncate">
                <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="font-medium text-slate-500">Manuscript:</span>
                <a
                  href={grant.preprint_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:underline truncate"
                >
                  {grant.preprint_url}
                </a>
              </div>
            )}
            {grant.raw_dataset_url && (
              <div className="flex items-center space-x-2 text-slate-600 truncate">
                <ExternalLink className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="font-medium text-slate-500">Raw Dataset / Code:</span>
                <a
                  href={grant.raw_dataset_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-600 hover:underline truncate"
                >
                  {grant.raw_dataset_url}
                </a>
              </div>
            )}
          </div>
        )}

        {/* Peer-Review AI Gauges if Evaluated */}
        {grant.status >= 2 && grant.verdict !== "PENDING" && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                <BrainCircuit className="w-3.5 h-3.5 text-indigo-600" />
                <span>AI Peer-Review Verdict:</span>
              </span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${verdictInfo.bg} ${verdictInfo.text} ${verdictInfo.border}`}>
                {verdictInfo.label}
              </span>
            </div>

            {/* Score Gauges */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 text-xs">
              <div>
                <div className="flex justify-between text-slate-600 mb-1 text-[11px]">
                  <span>Academic Rigor:</span>
                  <span className="font-mono font-bold text-indigo-700">{grant.rigor_score}/100</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      grant.rigor_score >= 80 ? "bg-emerald-500" : grant.rigor_score >= 50 ? "bg-amber-500" : "bg-red-500"
                    }`}
                    style={{ width: `${grant.rigor_score}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 mb-1 text-[11px]">
                  <span>Reproducibility:</span>
                  <span className="font-mono font-bold text-emerald-700">{grant.reproducibility_pct}%</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      grant.reproducibility_pct >= 75 ? "bg-emerald-500" : grant.reproducibility_pct >= 50 ? "bg-amber-500" : "bg-red-500"
                    }`}
                    style={{ width: `${grant.reproducibility_pct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Critique summary snippet */}
            {grant.reason && (
              <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200/70 italic line-clamp-2">
                "{grant.reason}"
              </p>
            )}

            {/* Evidence Hash Snapshot */}
            {grant.evidence_hash && (
              <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 font-mono">
                <Hash className="w-3 h-3 text-slate-400" />
                <span className="truncate">Snapshot: {grant.evidence_hash}</span>
              </div>
            )}
          </div>
        )}

        {/* Stakeholder Details */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
          <div>
            <span className="text-[11px] block text-slate-400">Grantor DAO:</span>
            <span className="font-mono font-medium text-slate-700">{formatAddress(grant.grantor_dao)}</span>
          </div>
          <div className="text-right">
            <span className="text-[11px] block text-slate-400">Researcher / PI:</span>
            <span className="font-mono font-medium text-slate-700">{formatAddress(grant.researcher)}</span>
          </div>
        </div>
      </div>

      {/* Action Footer Buttons */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        {/* Status 0: Open -> Submit Deliverable */}
        {grant.status === 0 && (
          <button
            onClick={() => onOpenSubmit(grant)}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <span>Claim & Submit Research Deliverables</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Status 1: Submitted -> Adjudicate Peer-Review */}
        {grant.status === 1 && (
          <button
            onClick={() => onOpenAdjudicate(grant.grant_id)}
            disabled={isActionLoading}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <BrainCircuit className="w-4 h-4" />
            <span>Convene AI Peer-Review Council</span>
          </button>
        )}

        {/* Status 2: Awaiting Payout / Rebuttal Cooling Window (24 Blocks) */}
        {grant.status === 2 && (
          <div className="w-full space-y-2">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onOpenInspector(grant)}
                className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium transition"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>Audit Details</span>
              </button>

              <button
                onClick={() => onOpenAppeal(grant)}
                className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-medium transition"
              >
                <Scale className="w-3.5 h-3.5 text-amber-600" />
                <span>Appeal (10% Bond)</span>
              </button>
            </div>

            <button
              onClick={() => onFinalizeSettlement(grant.grant_id)}
              disabled={isActionLoading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Finalize Settlement & Disburse</span>
            </button>
          </div>
        )}

        {/* Status 6: Disputed -> Supreme Council Adjudication */}
        {grant.status === 6 && (
          <div className="w-full space-y-2">
            <button
              onClick={() => onOpenAdjudicateAppeal(grant)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Scale className="w-4 h-4" />
              <span>Supreme Council Replication Adjudication</span>
            </button>
          </div>
        )}

        {/* Status >= 3: Settled / Cancelled */}
        {grant.status >= 3 && grant.status !== 6 && (
          <div className="w-full flex items-center justify-between">
            <button
              onClick={() => onOpenInspector(grant)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium transition"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Inspect Immutable Record</span>
            </button>

            <span className="text-xs font-mono font-semibold text-slate-500">
              {grant.status === 3 ? "100% Disbursed" : grant.status === 4 ? "100% Refunded" : grant.status === 5 ? "50/50 Split" : "Reclaimed"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
