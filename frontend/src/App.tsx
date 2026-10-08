import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from 'genlayer-js';
import {
  DEFAULT_CONTRACT_ADDRESS,
  GENLAYER_STUDIONET,
  CHAIN_ID_HEX,
  CHAIN_ID_DECIMAL
} from './config/genlayer';
import { Navbar } from './components/Navbar';
import { StatsOverview } from './components/StatsOverview';
import { GrantCard } from './components/GrantCard';
import { CreateGrantModal } from './components/CreateGrantModal';
import { SubmitDeliverableModal } from './components/SubmitDeliverableModal';
import { PeerReviewInspectorModal } from './components/PeerReviewInspectorModal';
import { AppealModal } from './components/AppealModal';
import { ResearchGrantData } from './utils/formatters';
import {
  Search,
  Filter,
  Plus,
  Loader2,
  BookOpen,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  BrainCircuit,
  Info
} from 'lucide-react';

export function App() {
  const [account, setAccount] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [grants, setGrants] = useState<ResearchGrantData[]>([]);
  const [totalLocked, setTotalLocked] = useState<string>('0');
  const [totalSettled, setTotalSettled] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('all');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [submitGrant, setSubmitGrant] = useState<ResearchGrantData | null>(null);
  const [inspectGrant, setInspectGrant] = useState<ResearchGrantData | null>(null);
  const [appealGrant, setAppealGrant] = useState<ResearchGrantData | null>(null);
  const [appealMode, setAppealMode] = useState<'file_appeal' | 'adjudicate_appeal'>('file_appeal');

  // Connect MetaMask with Auto StudioNet Switch
  const connectWallet = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      alert('MetaMask or a Web3 browser extension was not detected. Please install MetaMask to interact.');
      return;
    }
    setIsConnecting(true);
    try {
      const ethereum = (window as any).ethereum;

      // 1. Switch or Add GenLayer StudioNet
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

      // 2. Request accounts
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

  // Fetch On-Chain State
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
      }
    } catch (err) {
      console.warn('Failed to load on-chain grants from GenLayer RPC:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContractData();
  }, [fetchContractData]);

  // Handle Create Grant
  const handleCreateGrant = async (title: string, spec: string, duration: number, escrowGen: string) => {
    if (!account) {
      await connectWallet();
      return;
    }
    setIsActionLoading(true);
    setStatusMessage('Locking GEN escrow for new research milestone on GenLayer...');
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

      setStatusMessage(`Transaction submitted (${txHash.slice(0, 10)}...). Waiting for block inclusion...`);
      await client.waitForTransactionReceipt({ hash: txHash });
      setStatusMessage('Grant created on-chain!');
      await fetchContractData();
    } finally {
      setIsActionLoading(false);
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  // Handle Submit Deliverable
  const handleSubmitDeliverable = async (grantId: number, paperUrl: string, datasetUrl: string) => {
    if (!account) {
      await connectWallet();
      return;
    }
    setIsActionLoading(true);
    setStatusMessage(`Linking preprint & raw dataset for Grant #${grantId}...`);
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

      setStatusMessage(`Transaction submitted (${txHash.slice(0, 10)}...).`);
      await client.waitForTransactionReceipt({ hash: txHash });
      setStatusMessage('Deliverables registered on-chain!');
      await fetchContractData();
    } finally {
      setIsActionLoading(false);
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  // Handle Adjudicate Peer-Review
  const handleAdjudicatePeerReview = async (grantId: number) => {
    if (!account) {
      await connectWallet();
      return;
    }
    setIsActionLoading(true);
    setStatusMessage(`Convening AI Peer-Review Council for Grant #${grantId}. GenLayer validators crawling arXiv/bioRxiv papers & raw data...`);
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

      setStatusMessage('Validators achieving semantic consensus on academic rigor & reproducibility...');
      await client.waitForTransactionReceipt({ hash: txHash });
      setStatusMessage('AI Peer-Review Council verdict reached on-chain!');
      await fetchContractData();
    } catch (err: any) {
      alert(`Peer-review adjudication error: ${err?.message || err}`);
    } finally {
      setIsActionLoading(false);
      setTimeout(() => setStatusMessage(''), 5000);
    }
  };

  // Handle File Rebuttal Appeal
  const handleFileAppeal = async (grantId: number, reason: string, bondWei: bigint) => {
    if (!account) {
      await connectWallet();
      return;
    }
    setIsActionLoading(true);
    setStatusMessage(`Staking 10% dispute bond & filing rebuttal appeal for Grant #${grantId}...`);
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

      setStatusMessage('Appeal registered. Awaiting Supreme Academic Council review...');
      await client.waitForTransactionReceipt({ hash: txHash });
      setStatusMessage('Appeal filed successfully!');
      await fetchContractData();
    } finally {
      setIsActionLoading(false);
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  // Handle Supreme Council Adjudication
  const handleAdjudicateAppeal = async (grantId: number, suppUrl: string) => {
    if (!account) {
      await connectWallet();
      return;
    }
    setIsActionLoading(true);
    setStatusMessage(`Supreme Academic Council verifying supplemental replication logs for Grant #${grantId}...`);
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
      setStatusMessage('Supreme Council final appellate verdict recorded!');
      await fetchContractData();
    } finally {
      setIsActionLoading(false);
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  // Handle Finalize Settlement
  const handleFinalizeSettlement = async (grantId: number) => {
    if (!account) {
      await connectWallet();
      return;
    }
    setIsActionLoading(true);
    setStatusMessage(`Finalizing settlement & disbursing escrow for Grant #${grantId}...`);
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
      alert(`Settlement finalization notice: ${err?.message || err}`);
    } finally {
      setIsActionLoading(false);
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  // Filter & Search Grants
  const filteredGrants = grants.filter((g) => {
    const matchesSearch =
      g.project_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.methodology_spec.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.grant_id.toString().includes(searchQuery);

    if (!matchesSearch) return false;

    if (activeTab === 'awaiting_review') return g.status === 1;
    if (activeTab === 'rebuttal') return g.status === 2 || g.status === 6;
    if (activeTab === 'settled') return g.status === 3;
    if (activeTab === 'fraud') return g.status === 4 || g.verdict === 'REJECTED_ACADEMIC_FRAUD';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <Navbar
        account={account}
        onConnect={connectWallet}
        onDisconnect={disconnectWallet}
        isConnecting={isConnecting}
        onRefresh={fetchContractData}
        isRefreshing={isLoading}
      />

      {/* Transaction / Consensus Status Banner */}
      {statusMessage && (
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 text-white px-4 py-2.5 text-center text-xs font-medium shadow-sm flex items-center justify-center space-x-2">
          {isActionLoading && <Loader2 className="w-4 h-4 animate-spin text-indigo-200" />}
          <span>{statusMessage}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Hero Section */}
        <div className="mb-8 p-8 rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white relative overflow-hidden shadow-xl border border-indigo-700/40">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-mono font-medium mb-4">
              <span>DeSci Track</span>
              <span>•</span>
              <span>Autonomous Peer-Review Court</span>
              <span>•</span>
              <span>Optimistic Democracy</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight leading-tight mb-3">
              Autonomous Scientific Grant Disbursement & Peer-Review Court
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans mb-6">
              Escrow milestone funding for decentralized science (BioDAOs, research foundations). GenLayer validators crawl raw preprints and simulation datasets to detect p-hacking, verify empirical reproducibility, and disburse grants automatically.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white font-semibold rounded-xl text-xs shadow-md shadow-indigo-950/40 transition flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Research Milestone</span>
              </button>

              <a
                href={`https://genlayer-explorer.vercel.app/address/${DEFAULT_CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium rounded-xl text-xs transition flex items-center space-x-1.5"
              >
                <span>Verify Contract on StudioNet</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
              </a>
            </div>
          </div>

          {/* Background Decorative Element */}
          <div className="absolute right-[-20px] bottom-[-20px] text-white/5 font-display text-[160px] font-black select-none pointer-events-none">
            DeSci
          </div>
        </div>

        {/* Protocol Statistics */}
        <StatsOverview
          grants={grants}
          totalLocked={totalLocked}
          totalSettled={totalSettled}
        />

        {/* Toolbar: Search, Filters, Tabs */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
          
          {/* Filter Tabs */}
          <div className="flex items-center space-x-1 p-1 bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              All Grants ({grants.length})
            </button>
            <button
              onClick={() => setActiveTab('awaiting_review')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'awaiting_review'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Awaiting Review ({grants.filter((g) => g.status === 1).length})
            </button>
            <button
              onClick={() => setActiveTab('rebuttal')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'rebuttal'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Rebuttal Window ({grants.filter((g) => g.status === 2 || g.status === 6).length})
            </button>
            <button
              onClick={() => setActiveTab('settled')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'settled'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Settled 100% ({grants.filter((g) => g.status === 3).length})
            </button>
            <button
              onClick={() => setActiveTab('fraud')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'fraud'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Fraud Refunded ({grants.filter((g) => g.status === 4 || g.verdict === 'REJECTED_ACADEMIC_FRAUD').length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, methodology, ID..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 shadow-sm"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* Grants Grid */}
        {isLoading && grants.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
            <h4 className="font-bold text-slate-800 text-sm">Reading GenLayer StudioNet State...</h4>
            <p className="text-xs text-slate-500 mt-1">Connecting to contract at {DEFAULT_CONTRACT_ADDRESS}</p>
          </div>
        ) : filteredGrants.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-slate-800 text-base">No Research Grants in this Category</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Create a new grant milestone to lock escrow or switch filter tabs to view other active projects.
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
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
                onOpenSubmit={(g) => setSubmitGrant(g)}
                onOpenAdjudicate={handleAdjudicatePeerReview}
                onOpenInspector={(g) => setInspectGrant(g)}
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
      <footer className="mt-12 border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-800">AgentGrant</span>
            <span>•</span>
            <span>Autonomous Scientific Grant Disbursement & Peer-Review Court</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="font-mono">GenLayer StudioNet (61999)</span>
            <span>•</span>
            <a
              href={`https://genlayer-explorer.vercel.app/address/${DEFAULT_CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 hover:underline flex items-center space-x-1"
            >
              <span>Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
export default App;
