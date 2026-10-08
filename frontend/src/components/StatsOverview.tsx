import React from 'react';
import { DollarSign, CheckCircle2, TrendingUp, Award, ShieldAlert, Cpu } from 'lucide-react';
import { ResearchGrantData, formatGEN } from '../utils/formatters';

interface StatsOverviewProps {
  grants: ResearchGrantData[];
  totalLocked: string;
  totalSettled: number;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ grants, totalLocked, totalSettled }) => {
  const evaluatedGrants = grants.filter(g => g.status >= 2 && g.rigor_score > 0);
  const avgRigor = evaluatedGrants.length
    ? Math.round(evaluatedGrants.reduce((acc, g) => acc + g.rigor_score, 0) / evaluatedGrants.length)
    : 0;

  const avgReproducibility = evaluatedGrants.length
    ? Math.round(evaluatedGrants.reduce((acc, g) => acc + g.reproducibility_pct, 0) / evaluatedGrants.length)
    : 0;

  const fraudCount = grants.filter(g => g.status === 4 || g.verdict === "REJECTED_ACADEMIC_FRAUD").length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-8">
      {/* 1. Total Locked */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm hover:border-indigo-300 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-500">Escrow Locked</span>
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-bold font-mono text-slate-900 tracking-tight">
          {formatGEN(totalLocked)} <span className="text-xs font-normal text-slate-500">GEN</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">Autonomous Escrow</p>
      </div>

      {/* 2. Total Settled */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm hover:border-emerald-300 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-500">Settled Grants</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-bold font-mono text-slate-900 tracking-tight">
          {totalSettled} <span className="text-xs font-normal text-slate-500">disbursed</span>
        </div>
        <p className="text-[11px] text-emerald-600 font-medium mt-1">Finalized Payouts</p>
      </div>

      {/* 3. Total Milestones in Court */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm hover:border-blue-300 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-500">Active Pipeline</span>
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Cpu className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-bold font-mono text-slate-900 tracking-tight">
          {grants.length} <span className="text-xs font-normal text-slate-500">projects</span>
        </div>
        <p className="text-[11px] text-blue-600 font-medium mt-1">On-Chain Registry</p>
      </div>

      {/* 4. Average Rigor Score */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm hover:border-indigo-300 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-500">Avg Academic Rigor</span>
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-bold font-mono text-indigo-700 tracking-tight">
          {avgRigor ? `${avgRigor}/100` : "--"}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">Methodology Quality</p>
      </div>

      {/* 5. Empirical Reproducibility */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm hover:border-emerald-300 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-500">Reproducibility</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-bold font-mono text-emerald-700 tracking-tight">
          {avgReproducibility ? `${avgReproducibility}%` : "--"}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">Raw Data Verification</p>
      </div>

      {/* 6. Academic Fraud Stopped */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm hover:border-red-300 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-500">Frauds Stopped</span>
          <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-bold font-mono text-red-600 tracking-tight">
          {fraudCount} <span className="text-xs font-normal text-slate-500">refunded</span>
        </div>
        <p className="text-[11px] text-red-600 font-medium mt-1">100% Capital Preserved</p>
      </div>
    </div>
  );
};
