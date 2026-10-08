import React from 'react';
import {
  X,
  BrainCircuit,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Hash,
  FileText,
  Database,
  ShieldCheck,
  Clock,
  Scale
} from 'lucide-react';
import { ResearchGrantData, getVerdictBadge, formatGEN } from '../utils/formatters';

interface PeerReviewInspectorModalProps {
  isOpen: boolean;
  grant: ResearchGrantData | null;
  onClose: () => void;
}

export const PeerReviewInspectorModal: React.FC<PeerReviewInspectorModalProps> = ({
  isOpen,
  grant,
  onClose,
}) => {
  if (!isOpen || !grant) return null;

  const verdictInfo = getVerdictBadge(grant.verdict);
  const auditBlock = parseInt(grant.audit_completed_block) || 0;
  const challengeDeadline = auditBlock + 24;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold font-display text-slate-900 text-base">AI Peer-Review Council Dossier</h3>
              <p className="text-xs text-slate-500">Milestone #{grant.grant_id} - On-Chain Scientific Audit Log</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          
          {/* Main Verdict Banner */}
          <div className={`p-4 rounded-xl border ${verdictInfo.bg} ${verdictInfo.border} flex items-start space-x-3`}>
            {grant.verdict === "MILESTONE_ACCEPTED_FULL" && <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />}
            {grant.verdict === "PARTIAL_REVISION_GRANT" && <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />}
            {grant.verdict === "REJECTED_ACADEMIC_FRAUD" && <XCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />}
            {grant.verdict === "PENDING" && <Clock className="w-6 h-6 text-slate-500 shrink-0 mt-0.5" />}

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${verdictInfo.text}`}>
                  Consensus Adjudication:
                </span>
                <span className="text-xs font-mono font-semibold text-slate-700">
                  Confidence: {grant.confidence}%
                </span>
              </div>
              <h4 className="text-base font-bold font-display text-slate-900 mt-0.5">
                {verdictInfo.label}
              </h4>
              <p className="text-xs text-slate-700 mt-2 bg-white/80 p-3 rounded-lg border border-slate-200/60 leading-relaxed font-sans">
                "{grant.reason}"
              </p>
            </div>
          </div>

          {/* Academic Rubric Statistics */}
          <div className="grid grid-cols-2 gap-4">
            {/* Rigor Gauge */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700">Academic Rigor Score</span>
                <span className="text-sm font-bold font-mono text-indigo-700">{grant.rigor_score}/100</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    grant.rigor_score >= 80 ? "bg-emerald-500" : grant.rigor_score >= 50 ? "bg-amber-500" : "bg-red-500"
                  }`}
                  style={{ width: `${grant.rigor_score}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Evaluation of statistical validity, sample sizes, control groups, and absence of p-hacking.
              </p>
            </div>

            {/* Reproducibility Percentage */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700">Empirical Reproducibility</span>
                <span className="text-sm font-bold font-mono text-emerald-700">{grant.reproducibility_pct}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    grant.reproducibility_pct >= 75 ? "bg-emerald-500" : grant.reproducibility_pct >= 50 ? "bg-amber-500" : "bg-red-500"
                  }`}
                  style={{ width: `${grant.reproducibility_pct}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Verification of raw code, logs, reproducible seeds, and open dataset integrity.
              </p>
            </div>
          </div>

          {/* Cryptographic Snapshot & Security Invariants */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2.5">
            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Immutable Cryptographic Verification</span>
            </h5>

            <div className="space-y-1 text-xs">
              <div className="flex items-start space-x-2">
                <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span className="text-slate-500 font-medium">Evidence SHA-256:</span>
                <span className="font-mono text-[11px] text-slate-800 break-all select-all">
                  {grant.evidence_hash || "Not computed"}
                </span>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <span className="text-slate-500 font-medium">Security Canary Defense:</span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-mono font-semibold">
                  CANARY_AGENT_GRANT_DESCI_V1 (Active)
                </span>
              </div>
            </div>
          </div>

          {/* Project & Timing Metadata */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/60 p-3.5 rounded-xl border border-slate-100">
            <div>
              <span className="text-slate-400 block text-[11px]">Milestone Escrow:</span>
              <span className="font-mono font-semibold text-slate-800">{formatGEN(grant.escrow_amount)} GEN</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Audit Completed Block:</span>
              <span className="font-mono font-semibold text-slate-800">Block #{grant.audit_completed_block}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Rebuttal Appeal Window:</span>
              <span className="font-mono font-semibold text-amber-700">24 Blocks (Closes at Block #{challengeDeadline})</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Dispute Bond (10%):</span>
              <span className="font-mono font-semibold text-slate-800">
                {formatGEN((BigInt(grant.escrow_amount || "0") * 10n) / 100n)} GEN
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
