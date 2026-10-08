import React, { useState } from 'react';
import { X, ShieldAlert, AlertTriangle, AlertCircle, Sparkles, Scale, DollarSign } from 'lucide-react';
import { ResearchGrantData, formatGEN } from '../utils/formatters';

interface WhistleblowerModalProps {
  isOpen: boolean;
  grant: ResearchGrantData | null;
  onClose: () => void;
  onSubmitReport: (grantId: number, evidenceUrl: string, allegation: string, bondWei: bigint) => Promise<void>;
  isLoading: boolean;
}

export const WhistleblowerModal: React.FC<WhistleblowerModalProps> = ({
  isOpen,
  grant,
  onClose,
  onSubmitReport,
  isLoading,
}) => {
  const [fraudType, setFraudType] = useState('p_hacking');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [allegation, setAllegation] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !grant) return null;

  const escrowBig = BigInt(grant.escrow_amount || "0");
  const minBond = (escrowBig * 5n) / 100n || 1n; // 5% bond

  const handleFillSample = () => {
    setFraudType('p_hacking');
    setEvidenceUrl('https://raw.githubusercontent.com/tuannguyen1995/AgentGrant/main/SECURITY.md');
    setAllegation('Whistleblower Forensic Audit: Raw CSV rows 104-120 exhibit synthetic step discontinuity; zero-resistance variance is mathematically impossible without ambient cooling.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanUrl = evidenceUrl.trim();
    const cleanMsg = allegation.trim();

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      setError('A valid public forensic audit or counter-evidence URL is required.');
      return;
    }
    if (cleanMsg.length < 10) {
      setError('Detailed fraud allegation (at least 10 characters) is required.');
      return;
    }

    try {
      await onSubmitReport(grant.grant_id, cleanUrl, `[${fraudType.toUpperCase()}] ${cleanMsg}`, minBond);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit whistleblower report.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0B0F19] text-slate-100 rounded-2xl max-w-xl w-full border border-amber-500/40 shadow-2xl shadow-amber-950/40 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/20 bg-gradient-to-r from-amber-950/50 via-slate-900 to-black">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold font-display text-amber-300 text-base">Whistleblower Integrity Report</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Permissionless
                </span>
              </div>
              <p className="text-xs text-slate-400">Grant #{grant.grant_id} • {grant.project_title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl flex items-start space-x-2 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Autofill Sample */}
          <div className="flex items-center justify-between p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs">
            <span className="text-slate-400">Testing Forensic Audit Flow?</span>
            <button
              type="button"
              onClick={handleFillSample}
              className="flex items-center space-x-1.5 px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-medium rounded-lg transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Autofill Sample Fraud Audit</span>
            </button>
          </div>

          {/* Staked Bond Info */}
          <div className="p-3.5 bg-amber-950/30 rounded-xl border border-amber-500/30 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-amber-300 font-semibold">
              <span className="flex items-center space-x-1.5">
                <Scale className="w-4 h-4 text-amber-400" />
                <span>Required Whistleblower Bond (5%):</span>
              </span>
              <span className="font-mono text-sm">{formatGEN(minBond)} GEN</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              <strong className="text-amber-200">Anti-Spam & Bounty Mechanism:</strong> Staking a 5% bond prevents frivolous defamation. If the AI Court validates your fraud allegations, your bond is returned in full PLUS a portion of the grant escrow as a bounty reward. If the report is malicious/fake, your bond is forfeited to the researcher.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Category of Academic Malpractice *
            </label>
            <select
              value={fraudType}
              onChange={(e) => setFraudType(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-slate-200 font-mono"
            >
              <option value="p_hacking">P-Hacking / Statistical Variance Manipulation ($p &lt; 0.05$ forcing)</option>
              <option value="fabricated_raw_data">Synthetic / Fabricated Raw Dataset (Phantom replicates)</option>
              <option value="missing_controls">Missing Negative / Blind Controls (Unsubstantiated claims)</option>
              <option value="plagiarism_ai_hallucination">Plagiarized Model / Artificial Intelligence Hallucination</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Public Counter-Evidence / Forensic Audit URL *
            </label>
            <input
              type="url"
              required
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              placeholder="https://pubpeer.com/publications/reproducibility_audit_report.txt"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40 font-mono text-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Detailed Whistleblowing Charges & Forensic Analysis *
            </label>
            <textarea
              required
              rows={3}
              value={allegation}
              onChange={(e) => setAllegation(e.target.value)}
              placeholder="Specify exact figure anomalies, mathematical inconsistencies, or unreproducible script logs..."
              className="w-full px-3.5 py-2.5 text-xs bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40 font-sans text-slate-200"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-xs font-semibold text-black bg-amber-400 hover:bg-amber-300 active:bg-amber-500 rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center space-x-2"
            >
              <span>{isLoading ? "Broadcasting Report..." : "Stake 5% Bond & Flag Fraud"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
