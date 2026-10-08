import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Wallet,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Activity,
  Layers,
  ChevronDown,
  Info
} from 'lucide-react';
import { DEFAULT_CONTRACT_ADDRESS } from '../config/genlayer';
import { formatAddress, formatGEN, UserRole, ROLE_DEFINITIONS } from '../utils/formatters';

interface NavbarProps {
  account: string;
  onConnect: () => void;
  onDisconnect: () => void;
  isConnecting: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
  activeRole: UserRole;
  onSelectRole: (role: UserRole) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  account,
  onConnect,
  onDisconnect,
  isConnecting,
  onRefresh,
  isRefreshing,
  activeRole,
  onSelectRole,
}) => {
  const [balance, setBalance] = useState<string>("0");
  const [isFauceting, setIsFauceting] = useState<boolean>(false);
  const [faucetMsg, setFaucetMsg] = useState<string>("");

  useEffect(() => {
    if (account) {
      fetchBalance(account);
    }
  }, [account]);

  const fetchBalance = async (userAddr: string) => {
    try {
      const res = await fetch("https://studio.genlayer.com/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_getBalance",
          params: [userAddr, "latest"],
          id: 1,
        }),
      });
      const data = await res.json();
      if (data && data.result) {
        setBalance(BigInt(data.result).toString());
      }
    } catch (e) {
      console.warn("Could not fetch balance:", e);
    }
  };

  const requestFaucet = async () => {
    if (!account) return;
    setIsFauceting(true);
    setFaucetMsg("Requesting 2 GEN from StudioNet faucet...");
    try {
      const res = await fetch("https://studio.genlayer.com/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "sim_fundAccount",
          params: [account, "0x1BC16D674EC80000"], // 2 GEN
          id: 1,
        }),
      });
      const data = await res.json();
      if (data && !data.error) {
        setFaucetMsg("Success! 2 GEN added to your wallet.");
        setTimeout(() => {
          fetchBalance(account);
          setFaucetMsg("");
        }, 3000);
      } else {
        setFaucetMsg("Faucet request completed. Refreshing...");
        setTimeout(() => {
          fetchBalance(account);
          setFaucetMsg("");
        }, 3000);
      }
    } catch {
      setFaucetMsg("Failed to reach StudioNet faucet.");
      setTimeout(() => setFaucetMsg(""), 3000);
    } finally {
      setIsFauceting(false);
    }
  };

  const roleConfig = ROLE_DEFINITIONS[activeRole];

  return (
    <header className="sticky top-0 z-40 bg-[#070A13]/95 backdrop-blur-xl border-b border-cyan-500/20 shadow-2xl shadow-cyan-950/20">
      
      {/* Top Protocol Telemetry Bar */}
      <div className="bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border-b border-cyan-500/10 px-4 sm:px-6 py-1.5 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1.5 text-cyan-400 font-mono">
            <Activity className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            <span className="font-semibold">GENLAYER STUDIONET (CHAIN 61999)</span>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Decentralized Science (DeSci) Peer-Review Protocol</span>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href={`https://genlayer-explorer.vercel.app/address/${DEFAULT_CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1 text-slate-400 hover:text-cyan-300 transition font-mono"
          >
            <span>Contract: {formatAddress(DEFAULT_CONTRACT_ADDRESS)}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 via-indigo-600 to-purple-600 p-[1.5px] shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-[#070A13] rounded-[10px] flex items-center justify-center text-2xl">
                🔬
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold font-display tracking-tight text-white">AgentGrant</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  v2.0 DeSci Court
                </span>
              </div>
              <p className="text-xs text-slate-400">Autonomous Grant Disbursement & Academic Integrity Court</p>
            </div>
          </div>

          {/* Interactive Role Selector Switcher */}
          <div className="flex items-center p-1 bg-slate-900/90 border border-slate-800 rounded-xl shadow-inner overflow-x-auto">
            <span className="text-[11px] font-mono text-slate-500 px-2 uppercase font-semibold tracking-wider hidden lg:inline">
              Active Role:
            </span>
            {(['dao', 'researcher', 'whistleblower', 'magistrate'] as UserRole[]).map((r) => {
              const def = ROLE_DEFINITIONS[r];
              const isSelected = activeRole === r;
              return (
                <button
                  key={r}
                  onClick={() => onSelectRole(r)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    isSelected
                      ? `bg-gradient-to-r ${def.color} shadow-md`
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                  title={def.desc}
                >
                  <span>{def.icon}</span>
                  <span>{def.badge}</span>
                </button>
              );
            })}
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-2.5">
            {/* Refresh State */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-900 border border-slate-800 rounded-xl transition"
              title="Refresh On-Chain State"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />
            </button>

            {/* Wallet & Balance */}
            {account ? (
              <div className="flex items-center space-x-2">
                {/* Balance + Faucet */}
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono">
                  <span className="text-slate-400">Balance:</span>
                  <span className="font-bold text-cyan-300">{formatGEN(balance)} GEN</span>
                  <button
                    onClick={requestFaucet}
                    disabled={isFauceting}
                    className="p-1 hover:bg-cyan-500/20 text-cyan-400 rounded transition"
                    title="Request 2 GEN on StudioNet"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Account button */}
                <button
                  onClick={onDisconnect}
                  className="flex items-center space-x-2 px-3.5 py-2 bg-gradient-to-r from-slate-900 to-black hover:border-cyan-500/40 text-white border border-slate-800 rounded-xl text-xs font-mono transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{formatAddress(account)}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onConnect}
                disabled={isConnecting}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-black font-bold rounded-xl text-xs shadow-lg shadow-cyan-500/20 transition"
              >
                <Wallet className="w-4 h-4 text-black" />
                <span>{isConnecting ? "Connecting..." : "Connect MetaMask"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Transient Faucet Notice */}
        {faucetMsg && (
          <div className="mt-2 py-1 px-4 text-center text-xs bg-cyan-950/60 border border-cyan-500/30 rounded-lg text-cyan-300 font-medium animate-fadeIn">
            {faucetMsg}
          </div>
        )}
      </div>

      {/* Role explanation banner */}
      <div className="bg-[#050811] px-4 sm:px-6 py-2 border-t border-slate-900 text-xs flex items-center justify-between">
        <div className="flex items-center space-x-2 text-slate-400">
          <span className="text-base">{roleConfig.icon}</span>
          <span className="font-semibold text-slate-200">{roleConfig.title}:</span>
          <span className="text-slate-400 hidden sm:inline">{roleConfig.desc}</span>
        </div>
        <span className="text-[11px] font-mono text-cyan-400/80">Permissioned Role Mode</span>
      </div>
    </header>
  );
};
