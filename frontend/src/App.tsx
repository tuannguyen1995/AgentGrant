import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from 'genlayer-js';
import {
  DEFAULT_CONTRACT_ADDRESS,
  GENLAYER_STUDIONET,
  CHAIN_ID_HEX
} from './config/genlayer';
import { Navbar } from './components/Navbar';
import { StatsOverview } from './components/StatsOverview';
import { GrantCard } from './components/GrantCard';
import { CreateGrantModal } from './components/CreateGrantModal';
import { SubmitDeliverableModal } from './components/SubmitDeliverableModal';
import { PeerReviewInspectorModal } from './components/PeerReviewInspectorModal';
import { AppealModal } from './components/AppealModal';
import { WhistleblowerModal } from './components/WhistleblowerModal';
import { FreezeModal } from './components/FreezeModal';
import { ResearchGrantData, UserRole, ROLE_DEFINITIONS, formatAddress } from './utils/formatters';
import {
  Search,
  Plus,
  Loader2,
  BookOpen,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  BrainCircuit,
  Snowflake,
  Activity,
  Layers,
  FileCheck
} from 'lucide-react';

export function App() {
  const [account, setAccount] = useState<string>('');
  const [activeRole, setActiveRole] = useState<UserRole>('dao');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [grants, setGrants] = useState<ResearchGrantData[]>([]);
  const [totalLocked, setTotalLocked] = useState<string>('0');
  const [totalSettled, setTotalSettled] = useState<number>(0);
  const [totalFraudsStopped, setTotalFraudsStopped] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('all');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [submitGrant, setSubmitGrant] = useState<ResearchGrantData | null>(null);
  const [inspectGrant, setInspectGrant] = useState<ResearchGrantData | null>(null);
  const [whistleblowerGrant, setWhistleblowerGrant] = useState<ResearchGrantData | null>(null);
  const [freezeGrant, setFreezeGrant] = useState<ResearchGrantData | null>(null);
  const [freezeMode, setFreezeMode] = useState<'freeze' | 'unfreeze'>('freeze');
  const [appealGrant, setAppealGrant] = useState<ResearchGrantData | null>(null);
  const [appealMode, setAppealMode] = useState<'file_appeal' | 'adjudicate_appeal'>('file_appeal');

  // Connect MetaMask
  const connectWallet = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      alert('MetaMask or a Web3 extension was not detected. Please install MetaMask to interact on-chain.');
      return;
    }
    setIsConnecting(true);
    try {
      const ethereum = (window as any).ethereum;
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: CHAIN_ID_HEX }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902 || switchError.code === -32603) {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: CHAIN_ID_HEX,
              chainName: 'Genlayer Studio Network',
              nativeCurrency: { name: 'GEN Token', symbol: 'GEN', decimals: 18 },
              rpcUrls: ['https://studio.genlayer.com/api'],
              blockExplorerUrls: ['https://genlayer-explorer.vercel.app'],
            }],
          });
        }
      }

      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
      }
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      alert('Could not connect wallet: ' + (err?.message || 'User rejected.'));
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount('');
  };

  // Fetch On-Chain State from GenLayer
  const fetchContractData = useCallback(async () => {
    setIsLoading(true);
    try {
      const client = createClient({
        chain: GENLAYER_STUDIONET,
      });

      // 1. Fetch all grants
      const rawGrants = await client.readContract({
        address: DEFAULT_CONTRACT_ADDRESS as `0x${string}`,
        functionName: 'get_all_grants',
        args: [],
      });

      if (rawGrants) {
        const parsed: ResearchGrantData[] = typeof rawGrants === 'string' ? JSON.parse(rawGrants) : rawGrants;
        setGrants(parsed);
      }

      // 2. Fetch stats
      const rawStats = await client.readContract({
        address: DEFAULT_CONTRACT_ADDRESS as `0x${string}`,
        functionName: 'get_stats',
        args: [],
      });
      if (rawStats) {
        const parsedStats = typeof rawStats === 'string' ? JSON.parse(rawStats) : rawStats;
        setTotalLocked(parsedStats.total_grant_locked || '0');
        setTotalSettled(Number(parsedStats.total_grants_settled || 0));
        setTotalFraudsStopped(Number(parsedStats.total_frauds_stopped || 0));
      }
    } catch (err) {
      console.warn('Failed to load on-chain state from GenLayer RPC:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContractData();
  }, [fetchContractData]);

  // 1. Create Grant
  const handleCreateGrant = async (title: string, spec: string, duration: number, escrowGen: string) => {
    if (!account) {
      await connectWallet();
      return;
    }
    setIsActionLoading(true);
    setStatusMessage('Broadcasting grant milestone creation and locking GEN escrow on GenLayer...');
    try {
      const client = createClient({
        chain: GENLAYER_STUDIONET,
        account: account as `0x${string}`,
      });

      const valueWei = BigInt(Math.floor(parseFloat(escrowGen) * 1e18));

      const txHash = await client.writeContract({
        address: DEFAULT_CONTRACT_ADDRESS as `0x${string}`,
        functionName: 'create_grant_milestone',
        args: [title, spec, duration],
        value: valueWei,
      });

      setStatusMessage(`Transaction submitted (${txHash.slice(0, 10)}...). Waiting for finality...`);
      await client.waitForTransactionReceipt({ hash: txHash });
      setStatusMessage('Milestone grant created successfully on-chain!');
      await fetchContractData();
    } finally {
      setIsActionLoading(false);
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  // 2. Submit Deliverables
  const handleSubmitDeliverable = async (grantId: number, paperUrl: string, datasetUrl: string) => {
    if (!account) {
      await connectWallet();
      return;
    }
    setIsActionLoading(true);
    setStatusMessage(`Submitting preprint & raw dataset links for Grant #${grantId}...`);
    try {
      const client = createClient({
        chain: GENLAYER_STUDIONET,
        account: account as `0x${string}`,
      });

      const txHash = await client.writeContract({
        address: DEFAULT_CONTRACT_ADDRESS as `0x${string}`,
        functionName: 'submit_research_deliverable',
        args: [grantId, paperUrl, datasetUrl],
        value: 0n,
      });

      setStatusMessage('Research deliverables recorded on GenLayer!');
      await client.waitForTransactionReceipt({ hash: txHash });
      await fetchContractData();
    } finally {
      setIsActionLoading(false);
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  // 3. Whistleblower Report Academic Fraud
  const handleReportFraud = async (grantId: number, evidenceUrl: string, allegation: string, bondWei: bigint) => {
    if (!account) {
      await connectWallet();
      return;
    }
    setIsActionLoading(true);
    setStatusMessage(`Staking ${bondWei} wei bond & filing forensic whistleblower report for Grant #${grantId}...`);
    try {
      const client = createClient({
        chain: GENLAYER_STUDIONET,
        account: account as `0x${string}`,
      });

      const txHash = await client.writeContract({
        address: DEFAULT_CONTRACT_ADDRESS as `0x${string}`,
        functionName: 'report_academic_fraud',
        args: [grantId, evidenceUrl, allegation],
        value: bondWei,
      });

      setStatusMessage('Whistleblower report broadcasted! Milestone quarantined in freeze status.');
      await client.waitForTransactionReceipt({ hash: txHash });
      await fetchContractData();
    } finally {
      setIsActionLoading(false);
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  // 4. Emergency Freeze
  const handleEmergencyFreeze = async (grantId: number, reason: string) => {
    if (!account) {
      await connectWallet();
      return;
    }
    setIsActionLoading(true);
    setStatusMessage(`Executing emergency freeze on Grant #${grantId}...`);
    try {
      const client = createClient({
        chain: GENLAYER_STUDIONET,
        account: account as `0x${string}`,
      });

      const txHash = await client.writeContract({
        address: DEFAULT_CONTRACT_ADDRESS as `0x${string}`,
        functionName: 'emergency_freeze',
        args: [grantId, reason],
        value: 0n,
      });

      await client.waitForTransactionReceipt({ hash: txHash });
      setStatusMessage('Milestone frozen in quarantine status!');
      await fetchContractData();
    } finally {
      setIsActionLoading(false);
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  // 5. Emergency Unfreeze
  const handleEmergencyUnfreeze = async (grantId: number) => {
    if (!account) {
      await connectWallet();
      return;
    }
    setIsActionLoading(true);
    setStatusMessage(`Lifting quarantine & unfreezing Grant #${grantId}...`);
    try {
      const client = createClient({
        chain: GENLAYER_STUDIONET,
        account: account as `0x${string}`,
      });

      const txHash = await client.writeContract({
        address: DEFAULT_CONTRACT_ADDRESS as `0x${string}`,
        functionName: 'emergency_unfreeze',
        args: [grantId],
        value: 0n,
      });

      await client.waitForTransactionReceipt({ hash: txHash });
      setStatusMessage('Quarantine lifted. Milestone restored to evaluation pipeline.');
      await fetchContractData();
    } finally {
      setIsActionLoading(false);
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  // 6. AI Peer-Review Adjudication
  const handleAdjudicatePeerReview = async (grantId: number) => {
    if (!account) {
      await connectWallet();
      return;
    }
    setIsActionLoading(true);
    setStatusMessage(`Convening AI Peer-Review Council. GenLayer validators crawling arXiv/bioRxiv papers & raw data...`);
    try {
      const client = createClient({
        chain: GENLAYER_STUDIONET,
        account: account as `0x${string}`,
      });

      const txHash = await client.writeContract({
        address: DEFAULT_CONTRACT_ADDRESS as `0x${string}`,
        functionName: 'adjudicate_peer_review',
        args: [grantId],
        value: 0n,
      });

      setStatusMessage('AI Consensus reached! Academic rigor & reproducibility evaluated.');
      await client.waitForTransactionReceipt({ hash: txHash });
      await fetchContractData();
    } catch (err: any) {
      alert(`Peer-review adjudication notice: ${err?.message || err}`);
    } finally {
      setIsActionLoading(false);
      setTimeout(() => setStatusMessage(''), 5000);
    }
  };

  // 7. Appeal Verdict
  const handleFileAppeal = async (grantId: number, reason: string, bondWei: bigint) => {
    if (!account) {
      await connectWallet();
      return;
    }
    setIsActionLoading(true);
    setStatusMessage(`Staking 10% appeal bond & filing rebuttal dispute for Grant #${grantId}...`);
    try {
      const client = createClient({
        chain: GENLAYER_STUDIONET,
        account: account as `0x${string}`,
      });

      const txHash = await client.writeContract({
        address: DEFAULT_CONTRACT_ADDRESS as `0x${string}`,
        functionName: 'appeal_verdict',
        args: [grantId, reason],
        value: bondWei,
      });

      await client.waitForTransactionReceipt({ hash: txHash });
      setStatusMessage('Appeal recorded. Ready for Supreme Academic Council review!');
      await fetchContractData();
    } finally {
      setIsActionLoading(false);
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  // 8. Supreme Council Adjudication
  const handleAdjudicateAppeal = async (grantId: number, suppUrl: string) => {
    if (!account) {
      await connectWallet();
      return;
    }
    setIsActionLoading(true);
    setStatusMessage(`Supreme Academic Council verifying supplemental replication audit for Grant #${grantId}...`);
    try {
      const client = createClient({
        chain: GENLAYER_STUDIONET,
        account: account as `0x${string}`,
      });

      const txHash = await client.writeContract({
        address: DEFAULT_CONTRACT_ADDRESS as `0x${string}`,
        functionName: 'adjudicate_appeal',
        args: [grantId, suppUrl],
        value: 0n,
      });

      await client.waitForTransactionReceipt({ hash: txHash });
      setStatusMessage('Supreme appellate verdict rendered on-chain!');
      await fetchContractData();
    } finally {
      setIsActionLoading(false);
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  // 9. Finalize Settlement
  const handleFinalizeSettlement = async (grantId: number) => {
    if (!account) {
      await connectWallet();
      return;
    }
    setIsActionLoading(true);
    setStatusMessage(`Finalizing settlement & disbursing native GEN for Grant #${grantId}...`);
    try {
      const client = createClient({
        chain: GENLAYER_STUDIONET,
        account: account as `0x${string}`,
      });

      const txHash = await client.writeContract({
        address: DEFAULT_CONTRACT_ADDRESS as `0x${string}`,
        functionName: 'finalize_settlement',
        args: [grantId],
        value: 0n,
      });

      await client.waitForTransactionReceipt({ hash: txHash });
      setStatusMessage('Settlement finalized! Funds disbursed on-chain.');
      await fetchContractData();
    } catch (err: any) {
      alert(`Settlement notice: ${err?.message || err}`);
    } finally {
      setIsActionLoading(false);
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  // Filters & Search
  const filteredGrants = grants.filter((g) => {
    const matchesSearch =
      g.project_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.methodology_spec.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.grant_id.toString().includes(searchQuery);

    if (!matchesSearch) return false;

    if (activeTab === 'awaiting_review') return g.status === 1;
    if (activeTab === 'frozen') return g.is_frozen || g.status === 2;
    if (activeTab === 'rebuttal') return g.status === 3 || g.status === 7;
    if (activeTab === 'settled') return g.status === 4;
    if (activeTab === 'fraud') return g.status === 5 || g.verdict === 'REJECTED_ACADEMIC_FRAUD';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#070A13] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Navbar with Role Selector */}
      <Navbar
        account={account}
        onConnect={connectWallet}
        onDisconnect={disconnectWallet}
        isConnecting={isConnecting}
        onRefresh={fetchContractData}
        isRefreshing={isLoading}
        activeRole={activeRole}
        onSelectRole={setActiveRole}
      />

      {/* Transaction Broadcast Notification */}
      {statusMessage && (
        <div className="bg-gradient-to-r from-cyan-950 via-indigo-950 to-purple-950 border-b border-cyan-500/30 text-cyan-200 px-4 py-2.5 text-center text-xs font-mono font-medium shadow-lg flex items-center justify-center space-x-2">
          {isActionLoading && <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />}
          <span>{statusMessage}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Cyber DeSci Hero Terminal */}
        <div className="mb-8 p-8 rounded-3xl bg-gradient-to-br from-[#0B0F19] via-[#0F172A] to-[#070A13] border border-cyan-500/30 relative overflow-hidden shadow-2xl shadow-cyan-950/30">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold mb-4">
              <span>DECENTRALIZED SCIENCE</span>
              <span>•</span>
              <span>AUTONOMOUS PEER-REVIEW COURT</span>
              <span>•</span>
              <span>ZERO MOCK / 100% ON-CHAIN</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight leading-tight text-white mb-3">
              Autonomous Scientific Grant Disbursement & Academic Integrity Court
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans mb-6">
              Escrow milestone grants on GenLayer. AI validators crawl preprint papers and raw simulation datasets directly on-chain without oracles to detect p-hacking, verify empirical reproducibility, enforce whistleblower reports, and execute automatic payouts.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-black font-bold rounded-xl text-xs shadow-lg shadow-cyan-500/25 transition flex items-center space-x-2"
              >
                <Plus className="w-4 h-4 text-black" />
                <span>+ Create Milestone Escrow</span>
              </button>

              <a
                href={`https://genlayer-explorer.vercel.app/address/${DEFAULT_CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 font-medium rounded-xl text-xs transition flex items-center space-x-1.5 font-mono"
              >
                <span>Verify Contract: {formatAddress(DEFAULT_CONTRACT_ADDRESS)}</span>
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              </a>
            </div>
          </div>

          <div className="absolute right-[-20px] bottom-[-20px] text-cyan-500/5 font-display text-[180px] font-black select-none pointer-events-none">
            DeSci
          </div>
        </div>

        {/* Protocol Statistics */}
        <StatsOverview
          grants={grants}
          totalLocked={totalLocked}
          totalSettled={totalSettled}
          totalFraudsStopped={totalFraudsStopped}
        />

        {/* Toolbar: Search, Filters, Tabs */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
          
          {/* Filter Tabs */}
          <div className="flex items-center space-x-1 p-1 bg-[#0B0F19] border border-slate-800 rounded-xl overflow-x-auto shadow-inner">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'all'
                  ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              All Grants ({grants.length})
            </button>
            <button
              onClick={() => setActiveTab('awaiting_review')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'awaiting_review'
                  ? 'bg-cyan-500 text-black font-bold shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Submitted ({grants.filter((g) => g.status === 1).length})
            </button>
            <button
              onClick={() => setActiveTab('frozen')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'frozen'
                  ? 'bg-red-500 text-white font-bold shadow-md'
                  : 'text-red-400 hover:text-red-300 hover:bg-red-950/30'
              }`}
            >
              Frozen / Quarantined ({grants.filter((g) => g.is_frozen || g.status === 2).length})
            </button>
            <button
              onClick={() => setActiveTab('rebuttal')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'rebuttal'
                  ? 'bg-amber-500 text-black font-bold shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Rebuttal Window ({grants.filter((g) => g.status === 3 || g.status === 7).length})
            </button>
            <button
              onClick={() => setActiveTab('settled')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'settled'
                  ? 'bg-emerald-500 text-black font-bold shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Approved 100% ({grants.filter((g) => g.status === 4).length})
            </button>
            <button
              onClick={() => setActiveTab('fraud')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'fraud'
                  ? 'bg-rose-500 text-white font-bold shadow-md'
                  : 'text-rose-400 hover:text-rose-300 hover:bg-rose-950/30'
              }`}
            >
              Fraud Refunded ({grants.filter((g) => g.status === 5 || g.verdict === 'REJECTED_ACADEMIC_FRAUD').length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, methodology, ID..."
              className="w-full pl-9 pr-4 py-2 bg-[#0B0F19] border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 shadow-inner"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* Grants Grid */}
        {isLoading && grants.length === 0 ? (
          <div className="p-16 text-center bg-[#0B0F19] rounded-3xl border border-slate-800 shadow-xl">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-3" />
            <h4 className="font-bold text-white text-sm">Reading GenLayer StudioNet State...</h4>
            <p className="text-xs text-slate-500 mt-1 font-mono">Contract: {DEFAULT_CONTRACT_ADDRESS}</p>
          </div>
        ) : filteredGrants.length === 0 ? (
          <div className="p-16 text-center bg-[#0B0F19] rounded-3xl border border-slate-800 shadow-xl">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h4 className="font-bold text-white text-base">No Research Milestones in this Category</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Create a new milestone grant or switch tabs to view active projects on StudioNet.
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="mt-4 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold rounded-xl shadow-lg transition"
            >
              Create Grant Milestone
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGrants.map((grant) => (
              <GrantCard
                key={grant.grant_id}
                grant={grant}
                account={account}
                activeRole={activeRole}
                onOpenSubmit={(g) => setSubmitGrant(g)}
                onOpenAdjudicate={handleAdjudicatePeerReview}
                onOpenInspector={(g) => setInspectGrant(g)}
                onOpenWhistleblower={(g) => setWhistleblowerGrant(g)}
                onOpenFreeze={(g, mode) => {
                  setFreezeGrant(g);
                  setFreezeMode(mode);
                }}
                onOpenAppeal={(g) => {
                  setAppealGrant(g);
                  setAppealMode('file_appeal');
                }}
                onOpenAdjudicateAppeal={(g) => {
                  setAppealGrant(g);
                  setAppealMode('adjudicate_appeal');
                }}
                onFinalizeSettlement={handleFinalizeSettlement}
                onCancelOrReclaim={() => {}}
                isActionLoading={isActionLoading}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateGrantModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateGrant}
        isLoading={isActionLoading}
      />

      <SubmitDeliverableModal
        isOpen={!!submitGrant}
        grant={submitGrant}
        onClose={() => setSubmitGrant(null)}
        onSubmit={handleSubmitDeliverable}
        isLoading={isActionLoading}
      />

      <WhistleblowerModal
        isOpen={!!whistleblowerGrant}
        grant={whistleblowerGrant}
        onClose={() => setWhistleblowerGrant(null)}
        onSubmitReport={handleReportFraud}
        isLoading={isActionLoading}
      />

      <FreezeModal
        isOpen={!!freezeGrant}
        grant={freezeGrant}
        mode={freezeMode}
        onClose={() => setFreezeGrant(null)}
        onSubmitFreeze={handleEmergencyFreeze}
        onSubmitUnfreeze={handleEmergencyUnfreeze}
        isLoading={isActionLoading}
      />

      <PeerReviewInspectorModal
        isOpen={!!inspectGrant}
        grant={inspectGrant}
        onClose={() => setInspectGrant(null)}
      />

      <AppealModal
        isOpen={!!appealGrant}
        grant={appealGrant}
        mode={appealMode}
        onClose={() => setAppealGrant(null)}
        onSubmitFileAppeal={handleFileAppeal}
        onSubmitAdjudicateAppeal={handleAdjudicateAppeal}
        isLoading={isActionLoading}
      />

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-900 bg-[#050811] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-300">AgentGrant DeSci Protocol</span>
            <span>•</span>
            <span>100% On-Chain GenLayer StudioNet (Chain 61999)</span>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href={`https://genlayer-explorer.vercel.app/address/${DEFAULT_CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:underline flex items-center space-x-1"
            >
              <span>GenLayer Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
