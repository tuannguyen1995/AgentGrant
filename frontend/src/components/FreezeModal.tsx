import React, { useState } from 'react';
import { X, Snowflake, AlertOctagon, CheckCircle2, AlertCircle } from 'lucide-react';
import { ResearchGrantData } from '../utils/formatters';

interface FreezeModalProps {
  isOpen: boolean;
  grant: ResearchGrantData | null;
  mode: 'freeze' | 'unfreeze';
  onClose: () => void;
  onSubmitFreeze: (grantId: number, reason: string) => Promise<void>;
  onSubmitUnfreeze: (grantId: number) => Promise<void>;
  isLoading: boolean;
}

export const FreezeModal: React.FC<FreezeModalProps> = ({
  isOpen,
  grant,
  mode,
  onClose,
  onSubmitFreeze,
  onSubmitUnfreeze,
  isLoading,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !grant) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'freeze') {
      if (reason.trim().length < 5) {
        setError('Please provide a specific freeze reason (at least 5 characters).');
        return;
      }
      try {
        await onSubmitFreeze(grant.grant_id, reason.trim());
        onClose();
      } catch (err: any) {
        setError(err?.message || 'Failed to emergency freeze milestone.');
      }
    } else {
      try {
        await onSubmitUnfreeze(grant.grant_id);
        onClose();
      } catch (err: any) {
        setError(err?.message || 'Failed to unfreeze milestone.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0B0F19] text-slate-100 rounded-2xl max-w-lg w-full border border-red-500/40 shadow-2xl shadow-red-950/40 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-red-500/20 bg-gradient-to-r from-red-950/60 via-slate-900 to-black">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center">
              {mode === 'freeze' ? <Snowflake className="w-5 h-5 text-red-400 animate-spin" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            </div>
            <div>
              <h3 className="font-bold font-display text-red-300 text-base">
                {mode === 'freeze' ? 'Emergency Milestone Freeze' : 'Lift Quarantine & Unfreeze'}
              </h3>
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

          {mode === 'freeze' ? (
            <>
              <div className="p-3.5 bg-red-950/30 rounded-xl border border-red-500/30 text-xs space-y-1.5">
                <span className="font-semibold text-red-300 flex items-center space-x-1.5">
                  <AlertOctagon className="w-4 h-4 text-red-400" />
                  <span>Capital Preservation Protocol:</span>
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Freezing immediately halts any pending settlement payouts and transitions the milestone status to <strong>Quarantine (STATUS_FROZEN_FLAGGED)</strong>. Funds cannot be withdrawn until an AI Forensic Court review is completed or the DAO lifts the freeze.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Freeze Justification & Audit Trigger *
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Statistical anomaly flagged by community auditor; preliminary data fails double-blind controls..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/40 text-slate-200"
                />
              </div>
            </>
          ) : (
            <div className="p-4 bg-emerald-950/30 rounded-xl border border-emerald-500/30 text-xs space-y-2">
              <span className="font-semibold text-emerald-300 block">Lifting Quarantine:</span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Confirming that the fraud allegation has been addressed. The milestone will be unfrozen and returned to normal peer-review processing.
              </p>
            </div>
          )}

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
              className={`px-5 py-2 text-xs font-semibold text-white rounded-xl shadow-lg transition flex items-center space-x-2 ${
                mode === 'freeze'
                  ? "bg-red-600 hover:bg-red-500 active:bg-red-700 shadow-red-600/30"
                  : "bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-emerald-600/30"
              }`}
            >
              <span>{isLoading ? "Executing on GenLayer..." : mode === 'freeze' ? "Confirm Emergency Freeze" : "Lift Freeze Quarantine"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
