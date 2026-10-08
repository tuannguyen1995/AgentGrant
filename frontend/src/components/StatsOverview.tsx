import React from 'react';
import { DollarSign, CheckCircle2, TrendingUp, Award, ShieldAlert, Snowflake, Cpu } from 'lucide-react';
import { ResearchGrantData, formatGEN } from '../utils/formatters';

interface StatsOverviewProps {
  grants: ResearchGrantData[];
  totalLocked: string;
  totalSettled: number;
  totalFraudsStopped: number;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  grants,
  totalLocked,
  totalSettled,
  totalFraudsStopped,
}) => {
  const evaluatedGrants = grants.filter(g => g.status >= 3 && g.rigor_score > 0);
  const avgRigor = evaluatedGrants.length
    ? Math.round(evaluatedGrants.reduce((acc, g) => acc + g.rigor_score, 0) / evaluatedGrants.length)
    : 0;

  const avgReproducibility = evaluatedGrants.length
    ? Math.round(evaluatedGrants.reduce((acc, g) => acc + g.reproducibility_pct, 0) / evaluatedGrants.length)
    : 0;

  const frozenCount = grants.filter(g => g.is_frozen || g.status === 2).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-8">
      
      {/* 1. Total Locked */}
      <div className="bg-[#0B0F19] p-4 rounded-2xl border border-cyan-500/20 shadow-lg shadow-cyan-950/20 hover:border-cyan-500/40 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Escrow Locked</span>
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-bold font-mono text-cyan-300 tracking-tight">
          {formatGEN(totalLocked)} <span className="text-xs font-normal text-slate-400">GEN</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">Autonomous Escrow</p>
      </div>

      {/* 2. Total Settled */}
      <div className="bg-[#0B0F19] p-4 rounded-2xl border border-emerald-500/20 shadow-lg shadow-emerald-950/20 hover:border-emerald-500/40 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Settled Grants</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-bold font-mono text-emerald-300 tracking-tight">
          {totalSettled} <span className="text-xs font-normal text-slate-400">payouts</span>
        </div>
        <p className="text-[11px] text-emerald-400 font-medium mt-1">Disbursed on Chain</p>
      </div>

      {/* 3. Quarantined & Frozen */}
      <div className="bg-[#0B0F19] p-4 rounded-2xl border border-red-500/20 shadow-lg shadow-red-950/20 hover:border-red-500/40 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Quarantine / Frozen</span>
          <div className="w-7 h-7 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center">
            <Snowflake className="w-4 h-4 text-red-400 animate-spin" />
          </div>
        </div>
        <div className="text-xl font-bold font-mono text-red-400 tracking-tight">
          {frozenCount} <span className="text-xs font-normal text-slate-400">milestones</span>
        </div>
        <p className="text-[11px] text-red-400 font-medium mt-1">Under Investigation</p>
      </div>

      {/* 4. Avg Academic Rigor */}
      <div className="bg-[#0B0F19] p-4 rounded-2xl border border-indigo-500/20 shadow-lg shadow-indigo-950/20 hover:border-indigo-500/40 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Avg Rigor Score</span>
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-bold font-mono text-indigo-300 tracking-tight">
          {avgRigor ? `${avgRigor}/100` : "--"}
        </div>
        <p className="text-[11px] text-slate-500 mt-1">Methodology Quality</p>
      </div>

      {/* 5. Empirical Reproducibility */}
      <div className="bg-[#0B0F19] p-4 rounded-2xl border border-teal-500/20 shadow-lg shadow-teal-950/20 hover:border-teal-500/40 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Reproducibility</span>
          <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-bold font-mono text-teal-300 tracking-tight">
          {avgReproducibility ? `${avgReproducibility}%` : "--"}
        </div>
        <p className="text-[11px] text-teal-400 font-medium mt-1">Empirical Code & Logs</p>
      </div>

      {/* 6. Frauds Stopped */}
      <div className="bg-[#0B0F19] p-4 rounded-2xl border border-amber-500/20 shadow-lg shadow-amber-950/20 hover:border-amber-500/40 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Frauds Stopped</span>
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-bold font-mono text-amber-300 tracking-tight">
          {totalFraudsStopped} <span className="text-xs font-normal text-slate-400">refunded</span>
        </div>
        <p className="text-[11px] text-amber-400 font-medium mt-1">P-Hacking Blocked</p>
      </div>
    </div>
  );
};
