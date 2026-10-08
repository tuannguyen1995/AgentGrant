import React, { useState } from 'react';
import { X, FileText, Database, AlertCircle, Sparkles } from 'lucide-react';
import { ResearchGrantData } from '../utils/formatters';

interface SubmitDeliverableModalProps {
  isOpen: boolean;
  grant: ResearchGrantData | null;
  onClose: () => void;
  onSubmit: (grantId: number, paperUrl: string, datasetUrl: string) => Promise<void>;
  isLoading: boolean;
}

export const SubmitDeliverableModal: React.FC<SubmitDeliverableModalProps> = ({
  isOpen,
  grant,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const [paperUrl, setPaperUrl] = useState('');
  const [dataUrl, setDataUrl] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !grant) return null;

  const handleFillSample = () => {
    setPaperUrl("https://raw.githubusercontent.com/tuannguyen1995/AgentGrant/main/README.md");
    setDataUrl("https://raw.githubusercontent.com/tuannguyen1995/AgentGrant/main/contracts/contract.py");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanPaper = paperUrl.trim();
    const cleanData = dataUrl.trim();

    if (!cleanPaper.startsWith('http://') && !cleanPaper.startsWith('https://')) {
      setError('A valid public preprint URL (http/https) is required.');
      return;
    }
    if (!cleanData.startsWith('http://') && !cleanData.startsWith('https://')) {
      setError('A valid public raw dataset / code repository URL (http/https) is required.');
      return;
    }

    try {
      await onSubmit(grant.grant_id, cleanPaper, cleanData);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Deliverable submission failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              📝
            </div>
            <div>
              <h3 className="font-bold font-display text-slate-900 text-base">Submit Research Deliverables</h3>
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

          {/* Sample Autofill Bar */}
          <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <span className="text-slate-500 font-medium">Testing in StudioNet?</span>
            <button
              type="button"
              onClick={handleFillSample}
              className="flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-indigo-600 font-semibold transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Autofill Sample URLs</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Preprint Manuscript URL (arXiv / bioRxiv / Zenodo) *
            </label>
            <div className="relative">
              <input
                type="url"
                required
                value={paperUrl}
                onChange={(e) => setPaperUrl(e.target.value)}
                placeholder="https://biorxiv.org/content/early/2026/crispr_repair_manuscript.txt"
                className="w-full pl-9 pr-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 font-mono font-medium"
              />
              <FileText className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Must be publicly crawlable by GenLayer validators on-chain.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Raw Experimental Dataset / Simulation Code URL *
            </label>
            <div className="relative">
              <input
                type="url"
                required
                value={dataUrl}
                onChange={(e) => setDataUrl(e.target.value)}
                placeholder="https://zenodo.org/record/8921102/raw_sequencing_fastq.csv"
                className="w-full pl-9 pr-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 font-mono font-medium"
              />
              <Database className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Provide open raw data, Jupyter notebooks, or CSV files to satisfy empirical reproducibility verification.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <span className="font-semibold text-slate-800 block">Required Milestone Invariants:</span>
            <p className="italic text-slate-700">{grant.methodology_spec}</p>
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
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-sm shadow-indigo-200 transition"
            >
              {isLoading ? "Submitting..." : "Submit Deliverables"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
