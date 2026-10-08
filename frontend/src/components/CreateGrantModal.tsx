import React, { useState } from 'react';
import { X, DollarSign, BookOpen, Clock, AlertCircle } from 'lucide-react';

interface CreateGrantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, spec: string, duration: number, escrowGen: string) => Promise<void>;
  isLoading: boolean;
}

export const CreateGrantModal: React.FC<CreateGrantModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const [title, setTitle] = useState('');
  const [spec, setSpec] = useState('');
  const [duration, setDuration] = useState('6000');
  const [escrow, setEscrow] = useState('1.0');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (title.trim().length < 5) {
      setError('Project title must be at least 5 characters.');
      return;
    }
    if (spec.trim().length < 10) {
      setError('Methodology specifications must be at least 10 characters.');
      return;
    }
    const numEscrow = parseFloat(escrow);
    if (isNaN(numEscrow) || numEscrow <= 0) {
      setError('Escrow funding must be greater than 0 GEN.');
      return;
    }

    try {
      await onSubmit(title.trim(), spec.trim(), parseInt(duration) || 6000, escrow.trim());
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Transaction submission failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              +
            </div>
            <div>
              <h3 className="font-bold font-display text-slate-900 text-base">Create Scientific Grant Milestone</h3>
              <p className="text-xs text-slate-500">Lock GEN escrow with verifiable open science invariants</p>
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Scientific Project Title & Objective *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. CRISPR Off-Target Epigenetic Repair In Vivo"
              className="w-full px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 font-sans font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Methodology Specifications & Mathematical Invariants *
            </label>
            <textarea
              required
              rows={3}
              value={spec}
              onChange={(e) => setSpec(e.target.value)}
              placeholder="e.g. Double-blind NGS sequencing with raw FASTQ counts; statistical significance p < 0.01; negative controls included."
              className="w-full px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 font-sans font-medium"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              The AI Peer-Review Council will verify preprint manuscripts and raw datasets against these criteria.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Milestone Escrow (GEN) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={escrow}
                  onChange={(e) => setEscrow(e.target.value)}
                  placeholder="1.0"
                  className="w-full pl-8 pr-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 font-mono font-medium"
                />
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Duration (Blocks) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="6000"
                  className="w-full pl-8 pr-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 font-mono font-medium"
                />
                <Clock className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-[11px] text-indigo-900 leading-relaxed">
            <span className="font-semibold block mb-0.5">🔒 Escrow Protection Guarantee:</span>
            Funds remain locked in smart contract escrow until the AI Peer-Review Court evaluates the deliverable. If the deliverable is rejected as fraudulent or unreproducible, 100% of funds are refunded back to your DAO.
          </div>

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
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-sm shadow-indigo-200 transition flex items-center space-x-2"
            >
              <span>{isLoading ? "Locking Escrow..." : "Deposit & Create Grant"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
