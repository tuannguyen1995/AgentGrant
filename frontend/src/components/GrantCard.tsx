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
  ArrowRight,
  Snowflake,
  AlertOctagon,
  Unlock,
  Award
} from 'lucide-react';
import {
  ResearchGrantData,
  STATUS_LABELS,
  formatAddress,
  formatGEN,
  getVerdictBadge,
  UserRole
} from '../utils/formatters';

interface GrantCardProps {
  grant: ResearchGrantData;
  account: string;
  activeRole: UserRole;
  onOpenSubmit: (grant: ResearchGrantData) => void;
  onOpenAdjudicate: (grantId: number) => void;
  onOpenInspector: (grant: ResearchGrantData) => void;
  onOpenWhistleblower: (grant: ResearchGrantData) => void;
  onOpenFreeze: (grant: ResearchGrantData, mode: 'freeze' | 'unfreeze') => void;
  onOpenAppeal: (grant: ResearchGrantData) => void;
  onOpenAdjudicateAppeal: (grant: ResearchGrantData) => void;
  onFinalizeSettlement: (grantId: number) => void;
  onCancelOrReclaim: (grantId: number) => void;
  isActionLoading: boolean;
}

export const GrantCard: React.FC<GrantCardProps> = ({
  grant,
  account,
  activeRole,
  onOpenSubmit,
  onOpenAdjudicate,
  onOpenInspector,
  onOpenWhistleblower,
  onOpenFreeze,
  onOpenAppeal,
  onOpenAdjudicateAppeal,
  onFinalizeSettlement,
  onCancelOrReclaim,
  isActionLoading,
}) => {
  const statusInfo = STATUS_LABELS[grant.status] || STATUS_LABELS[0];
  const verdictInfo = getVerdictBadge(grant.verdict);

  return (
    <div className={`bg-[#0B0F19] rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-xl ${
      grant.is_frozen
        ? "border-red-500/50 shadow-red-950/30 ring-1 ring-red-500/30"
        : "border-slate-800 hover:border-cyan-500/40 shadow-black/40 hover:shadow-cyan-950/20"
    }`}>
      
      {/* Top Banner if Frozen */}
      {grant.is_frozen && (
        <div className="bg-gradient-to-r from-red-950 via-red-900 to-black px-4 py-2 border-b border-red-500/30 text-xs text-red-200 flex items-center justify-between">
          <span className="flex items-center space-x-1.5 font-bold font-mono">
            <Snowflake className="w-3.5 h-3.5 text-red-400 animate-spin" />
            <span>QUARANTINE / FROZEN BY {formatAddress(grant.frozen_by)}</span>
          </span>
          <span className="text-[10px] bg-red-500/20 px-2 py-0.5 rounded border border-red-500/40 text-red-300 font-mono">
            Payout Blocked
          </span>
        </div>
      )}

      {/* Main Card Content */}
      <div className="p-6">
        
        {/* Header Badges */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-cyan-300 font-mono text-xs font-bold border border-slate-800">
              #{grant.grant_id}
            </span>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border} ${statusInfo.glow}`}>
              {statusInfo.title}
            </span>
          </div>

          <div className="text-right">
            <div className="text-lg font-bold font-mono text-cyan-300">
              {formatGEN(grant.escrow_amount)} GEN
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Milestone Escrow</div>
          </div>
        </div>

        {/* Project Title */}
        <h3 className="text-lg font-bold font-display text-white leading-snug mb-2 hover:text-cyan-300 transition">
          {grant.project_title}
        </h3>

        {/* Methodology Criteria */}
        <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80 mb-4 text-xs text-slate-300">
          <span className="font-semibold text-slate-400 block mb-1 text-[11px] uppercase tracking-wider">
            Methodology & Invariants:
          </span>
          <p className="line-clamp-2 italic text-slate-300 font-sans">{grant.methodology_spec}</p>
        </div>

        {/* Whistleblower Allegations Banner if Reported */}
        {grant.fraud_allegation && (
          <div className="p-3 bg-amber-950/30 rounded-xl border border-amber-500/30 text-xs mb-4 space-y-1">
            <div className="flex items-center justify-between text-amber-300 font-semibold text-[11px]">
              <span className="flex items-center space-x-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Whistleblower Report:</span>
              </span>
              <span className="font-mono">{formatGEN(grant.whistleblower_bond)} GEN Bond</span>
            </div>
            <p className="text-[11px] text-slate-300 italic line-clamp-2">
              "{grant.fraud_allegation}"
            </p>
          </div>
        )}

        {/* Submitted Deliverables Links */}
        {grant.status >= 1 && (grant.preprint_url || grant.raw_dataset_url) && (
          <div className="space-y-1.5 mb-4 text-xs">
            {grant.preprint_url && (
              <div className="flex items-center space-x-2 text-slate-400 truncate">
                <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="font-medium text-slate-500 text-[11px]">Manuscript:</span>
                <a
                  href={grant.preprint_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:underline truncate font-mono text-[11px]"
                >
                  {grant.preprint_url}
                </a>
              </div>
            )}
            {grant.raw_dataset_url && (
              <div className="flex items-center space-x-2 text-slate-400 truncate">
                <ExternalLink className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span className="font-medium text-slate-500 text-[11px]">Raw Dataset:</span>
                <a
                  href={grant.raw_dataset_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal-400 hover:underline truncate font-mono text-[11px]"
                >
                  {grant.raw_dataset_url}
                </a>
              </div>
            )}
          </div>
        )}

        {/* AI Peer-Review Gauges if Adjudicated */}
        {grant.status >= 3 && grant.verdict !== "PENDING" && (
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 mb-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <BrainCircuit className="w-3.5 h-3.5 text-cyan-400" />
                <span>AI Council Verdict:</span>
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${verdictInfo.bg} ${verdictInfo.text} ${verdictInfo.border}`}>
                {verdictInfo.label}
              </span>
            </div>

            {/* Score Gauges */}
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800 text-xs">
              <div>
                <div className="flex justify-between text-slate-400 mb-1 text-[10px]">
                  <span>Academic Rigor:</span>
                  <span className="font-mono font-bold text-cyan-300">{grant.rigor_score}/100</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      grant.rigor_score >= 80 ? "bg-emerald-500" : grant.rigor_score >= 50 ? "bg-amber-500" : "bg-red-500"
                    }`}
                    style={{ width: `${grant.rigor_score}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1 text-[10px]">
                  <span>Reproducibility:</span>
                  <span className="font-mono font-bold text-teal-300">{grant.reproducibility_pct}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      grant.reproducibility_pct >= 75 ? "bg-emerald-500" : grant.reproducibility_pct >= 50 ? "bg-amber-500" : "bg-red-500"
                    }`}
                    style={{ width: `${grant.reproducibility_pct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* AI Summary snippet */}
            {grant.reason && (
              <p className="text-[11px] text-slate-300 bg-slate-950 p-2 rounded-lg border border-slate-800/80 italic line-clamp-2">
                "{grant.reason}"
              </p>
            )}

            {/* Cryptographic hash */}
            {grant.evidence_hash && (
              <div className="flex items-center space-x-1 text-[10px] text-slate-500 font-mono">
                <Hash className="w-3 h-3 text-slate-600" />
                <span className="truncate">Snapshot: {grant.evidence_hash}</span>
              </div>
            )}
          </div>
        )}

        {/* Stakeholder Details */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80">
          <div>
            <span className="text-[10px] block text-slate-500">Grantor DAO:</span>
            <span className="font-mono text-slate-300">{formatAddress(grant.grantor_dao)}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] block text-slate-500">Researcher PI:</span>
            <span className="font-mono text-slate-300">{formatAddress(grant.researcher)}</span>
          </div>
        </div>
      </div>

      {/* Action Footer Buttons */}
      <div className="p-4 bg-slate-950/80 border-t border-slate-800/80 space-y-2">
        
        {/* Primary State Flow Buttons */}
        {grant.status === 0 && (
          <button
            onClick={() => onOpenSubmit(grant)}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-black font-bold rounded-xl text-xs shadow-lg transition"
          >
            <span>Claim & Submit Research Deliverables</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}

        {(grant.status === 1 || grant.status === 2) && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onOpenAdjudicate(grant.grant_id)}
              disabled={isActionLoading}
              className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-md transition"
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>AI Phán Quyết</span>
            </button>

            <button
              onClick={() => onOpenWhistleblower(grant)}
              className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold rounded-xl text-xs transition"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Tố Cáo Gian Lận</span>
            </button>
          </div>
        )}

        {grant.status === 3 && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onOpenInspector(grant)}
                className="flex items-center justify-center space-x-1 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-medium transition"
              >
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>Hồ Sơ Mật Mã</span>
              </button>

              <button
                onClick={() => onOpenAppeal(grant)}
                className="flex items-center justify-center space-x-1 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-medium transition"
              >
                <Scale className="w-3.5 h-3.5 text-amber-400" />
                <span>Kháng Cáo (10% Bond)</span>
              </button>
            </div>

            <button
              onClick={() => onFinalizeSettlement(grant.grant_id)}
              disabled={isActionLoading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Giải Ngân & Tất Toán Payout</span>
            </button>
          </div>
        )}

        {grant.status === 7 && (
          <button
            onClick={() => onOpenAdjudicateAppeal(grant)}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs shadow-md transition"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Tòa Án Tối Cao Phúc Thẩm</span>
          </button>
        )}

        {grant.status >= 4 && grant.status !== 7 && (
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => onOpenInspector(grant)}
              className="flex items-center space-x-1 text-xs text-slate-400 hover:text-cyan-300 transition"
            >
              <FileText className="w-3 h-3" />
              <span>Xem Hồ Sơ Thanh Tra</span>
            </button>
            <span className="text-[11px] font-mono font-bold text-slate-400">
              {grant.status === 4 ? "Đã Giải Ngân 100%" : grant.status === 5 ? "Đã Hoàn Quỹ Fraud" : grant.status === 6 ? "Đã Giải Ngân 50/50" : "Đã Hủy"}
            </span>
          </div>
        )}

        {/* Governance Controls Bar: Freeze / Unfreeze */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-[11px]">
          {grant.is_frozen ? (
            <button
              onClick={() => onOpenFreeze(grant, 'unfreeze')}
              className="flex items-center space-x-1 text-emerald-400 hover:text-emerald-300 transition"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Mở Phong Tỏa</span>
            </button>
          ) : (
            <button
              onClick={() => onOpenFreeze(grant, 'freeze')}
              className="flex items-center space-x-1 text-red-400 hover:text-red-300 transition"
            >
              <Snowflake className="w-3.5 h-3.5" />
              <span>Phong Tỏa Khẩn Cấp</span>
            </button>
          )}

          {grant.fraud_evidence_url && (
            <a
              href={grant.fraud_evidence_url}
              target="_blank"
              rel="noreferrer"
              className="text-amber-400 hover:underline flex items-center space-x-1"
            >
              <span>Audit URL</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
