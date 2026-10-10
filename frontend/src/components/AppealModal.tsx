import React, { useState } from 'react';
import { X, Scale, AlertTriangle, AlertCircle, Sparkles } from 'lucide-react';
import { ResearchGrantData, formatGEN } from '../utils/formatters';

interface AppealModalProps {
  isOpen: boolean;
  grant: ResearchGrantData | null;
  mode: 'file_appeal' | 'adjudicate_appeal';
  onClose: () => void;
  onSubmitFileAppeal: (grantId: number, reason: string, bondWei: bigint, suppUrl?: string) => Promise<void>;
  onSubmitAdjudicateAppeal: (grantId: number, suppUrl: string) => Promise<void>;
  isLoading: boolean;
}

export const AppealModal: React.FC<AppealModalProps> = ({
  isOpen,
  grant,
  mode,
  onClose,
  onSubmitFileAppeal,
  onSubmitAdjudicateAppeal,
  isLoading,
}) => {
  const [reason, setReason] = useState('');
  const [suppUrl, setSuppUrl] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !grant) return null;

  const escrowBig = BigInt(grant.escrow_amount || "0");
  const requiredBond = (escrowBig * 10n) / 100n || 1n;

  const handleFillSample = () => {
    if (mode === 'file_appeal') {
      setReason("Independent replication by external accredited genomics laboratory refutes p-hacking claims; raw sequencing FASTQ logs re-verified.");
      setSuppUrl("https://raw.githubusercontent.com/tuannguyen1995/AgentGrant/main/contracts/contract.py");
    } else {
      setSuppUrl("https://raw.githubusercontent.com/tuannguyen1995/AgentGrant/main/contracts/contract.py");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'file_appeal') {
      if (reason.trim().length < 10) {
        setError('Detailed rebuttal justification (at least 10 characters) is required.');
        return;
      }
      try {
        await onSubmitFileAppeal(grant.grant_id, reason.trim(), requiredBond, suppUrl.trim());
        onClose();
      } catch (err: any) {
        setError(err?.message || 'Failed to file appeal.');
      }
    } else {
      if (!suppUrl.trim().startsWith('http://') && !suppUrl.trim().startsWith('https://')) {
        setError('A valid supplemental replication audit URL (http/https) is required.');
        return;
      }
      try {
        await onSubmitAdjudicateAppeal(grant.grant_id, suppUrl.trim());
        onClose();
      } catch (err: any) {
        setError(err?.message || 'Failed to adjudicate appeal.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
              mode === 'file_appeal' ? "bg-amber-100 text-amber-700" : "bg-purple-100 text-purple-700"
            }`}>
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold font-display text-slate-900 text-base">
                {mode === 'file_appeal' ? 'File Rebuttal Dispute Appeal' : 'Supreme Academic Council Adjudication'}
              </h3>
              <p className="text-xs text-slate-500">Grant #{grant.grant_id} - {grant.project_title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Autofill sample button */}
          <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <span className="text-slate-500 font-medium">Quick Testing?</span>
            <button
              type="button"
              onClick={handleFillSample}
              className="flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-indigo-600 font-semibold transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Autofill Justification</span>
            </button>
          </div>

          {mode === 'file_appeal' ? (
            <>
              {/* Dispute Bond info */}
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-1">
                <div className="flex justify-between font-semibold text-amber-900">
                  <span>Required Dispute Bond (10%):</span>
                  <span className="font-mono text-sm">{formatGEN(requiredBond)} GEN</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  Antispam Stake: The bond is fully refunded if your appeal is upheld. If the appeal is dismissed as frivolous, the bond is forfeited to the counterparty.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rebuttal Justification & Empirical Defense *
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Detail the independent laboratory replications, calibration standard certificates, or counter-evidence addressing the prior AI peer-review critique..."
                  className="w-full px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 font-sans font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supplemental Replication Audit URL (Optional / Recommended)
                </label>
                <input
                  type="url"
                  value={suppUrl}
                  onChange={(e) => setSuppUrl(e.target.value)}
                  placeholder="https://nrel.gov/pv/calibration/cert_9881.txt"
                  className="w-full px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 font-mono font-medium"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Attached replication evidence will be stored on-chain and reviewed by the Supreme Academic Council.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs space-y-1">
                <span className="font-semibold text-purple-900 block">Supreme Court Procedure:</span>
                <p className="text-[11px] text-purple-800 leading-relaxed">
                  The Supreme Academic Council will crawl the third-party independent lab audit logs below to decide whether to uphold the grant (100% release), uphold partially (50/50 split), or dismiss (100% refund).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supplemental Replication Audit URL *
                </label>
                <input
                  type="url"
                  required
                  value={suppUrl}
                  onChange={(e) => setSuppUrl(e.target.value)}
                  placeholder="https://nrel.gov/pv/calibration/cert_9881.txt"
                  className="w-full px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-600 font-mono font-medium"
                />
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-5 py-2 text-xs font-semibold text-white rounded-xl shadow-sm transition flex items-center space-x-2 ${
                mode === 'file_appeal'
                  ? "bg-amber-600 hover:bg-amber-700 active:bg-amber-800 shadow-amber-200"
                  : "bg-purple-600 hover:bg-purple-700 active:bg-purple-800 shadow-purple-200"
              }`}
            >
              <span>{isLoading ? "Processing..." : mode === 'file_appeal' ? "Stake Bond & File Appeal" : "Execute Supreme Adjudication"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
