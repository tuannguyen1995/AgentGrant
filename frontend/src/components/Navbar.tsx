import React, { useState, useEffect } from 'react';
import { ShieldCheck, Wallet, ExternalLink, RefreshCw, Sparkles, Activity } from 'lucide-react';
import { CHAIN_ID_DECIMAL, CHAIN_ID_HEX, DEFAULT_CONTRACT_ADDRESS, GENLAYER_STUDIONET } from '../config/genlayer';
import { formatAddress, formatGEN } from '../utils/formatters';

interface NavbarProps {
  account: string;
  onConnect: () => void;
  onDisconnect: () => void;
  isConnecting: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  account,
  onConnect,
  onDisconnect,
  isConnecting,
  onRefresh,
  isRefreshing,
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
          params: [account, "0x1BC16D674EC80000"], // 2 GEN in hex
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

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <span className="text-2xl">🔬</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold font-display tracking-tight text-slate-900">AgentGrant</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                  DeSci Court v1.0
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Autonomous Scientific Milestone Disbursement & Peer-Review</p>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-3">
            {/* Live Network Badge */}
            <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-800">
              <Activity className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>StudioNet (61999)</span>
            </div>

            {/* Contract Link */}
            <a
              href={`https://genlayer-explorer.vercel.app/address/${DEFAULT_CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
              className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-600 hover:text-indigo-600 hover:bg-slate-100 border border-slate-200 transition"
              title="View on GenLayer Explorer"
            >
              <span>Contract: {formatAddress(DEFAULT_CONTRACT_ADDRESS)}</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            {/* Data Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
              title="Refresh On-Chain State"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-indigo-600" : ""}`} />
            </button>

            {/* Wallet State */}
            {account ? (
              <div className="flex items-center space-x-2">
                {/* Balance & Faucet */}
                <div className="flex items-center space-x-2 pl-3 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  <span className="font-mono font-semibold text-slate-700">{formatGEN(balance)} GEN</span>
                  <button
                    onClick={requestFaucet}
                    disabled={isFauceting}
                    className="p-1 hover:bg-indigo-100 rounded text-indigo-600 font-medium transition"
                    title="Get 2 free GEN on StudioNet"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Account Button */}
                <button
                  onClick={onDisconnect}
                  className="flex items-center space-x-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-mono font-medium shadow-sm transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{formatAddress(account)}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onConnect}
                disabled={isConnecting}
                className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs font-semibold shadow-sm shadow-indigo-200 transition"
              >
                <Wallet className="w-4 h-4" />
                <span>{isConnecting ? "Connecting..." : "Connect MetaMask"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Transient Faucet Notice */}
        {faucetMsg && (
          <div className="py-1 px-4 text-center text-xs bg-indigo-50 border-t border-indigo-100 text-indigo-700 font-medium">
            {faucetMsg}
          </div>
        )}
      </div>
    </header>
  );
};
