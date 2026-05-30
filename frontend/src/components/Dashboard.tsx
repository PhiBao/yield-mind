"use client";

import { useAccount, useChainId } from "wagmi";
import { useState } from "react";
import { useVaultData } from "@/hooks/useVault";
import { PortfolioChart } from "./PortfolioChart";
import { VaultManager } from "./VaultManager";
import { StrategyForm } from "./StrategyForm";
import { PositionCard } from "./PositionCard";
import { Leaderboard } from "./Leaderboard";
import { TerminalHeader } from "./TerminalHeader";
import { TxToastContainer, useTxToast } from "./TransactionToast";
import { Faucet } from "./Faucet";
import { Cpu, TrendingUp, Wallet, Shield, Activity, ArrowRight, CheckCircle, Users, Sparkles } from "lucide-react";

const RISK_LABELS = ["Minimal", "Conservative", "Moderate", "Aggressive", "High Yield"];
const CHAIN_LABELS: Record<number, string> = { 42161: "Arbitrum One", 421614: "Arbitrum Sepolia", 46630: "Robinhood Testnet" };

function StatCard({ icon, label, value, accent = "green" }: { icon: React.ReactNode; label: string; value: string; accent?: string }) {
  return (
    <div className="terminal-window p-4 hover:border-terminal-green/30 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{label}</p>
          <p className={`stat-value mt-1 ${accent === "cyan" ? "glow-text-cyan" : accent === "magenta" ? "glow-text-magenta" : "glow-text"}`}>{value}</p>
        </div>
        <div className={`${accent === "cyan" ? "text-terminal-cyan" : accent === "magenta" ? "text-terminal-magenta" : "text-terminal-green"} opacity-60`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function QuickStartCard({ step, title, desc, active, done }: { step: number; title: string; desc: string; active: boolean; done: boolean }) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-lg border transition-all duration-300 ${
      active ? "border-terminal-green/50 bg-terminal-green/5" : done ? "border-terminal-green/20 bg-terminal-gray/20 opacity-70" : "border-terminal-border bg-terminal-gray/20 opacity-50"
    }`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
        done ? "bg-terminal-green/20 text-terminal-green border border-terminal-green/30" : active ? "bg-terminal-green/10 text-terminal-green border border-terminal-green/50 glow-text" : "bg-terminal-gray/50 text-terminal-muted border border-terminal-border"
      }`}>{done ? <CheckCircle className="w-4 h-4" /> : step}</div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-mono font-semibold ${active ? "text-terminal-green" : done ? "text-terminal-muted" : "text-terminal-muted/60"}`}>{title}</p>
        <p className="text-[10px] font-mono text-terminal-muted/70 mt-0.5">{desc}</p>
      </div>
      {active && <ArrowRight className="w-4 h-4 text-terminal-green animate-pulse shrink-0" />}
    </div>
  );
}

export function Dashboard() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const vault = useVaultData();
  const { txs, addTx, removeTx, updateTx } = useTxToast();
  const [copiedStrategy, setCopiedStrategy] = useState<{ allocationPct: number; riskLevel: number } | null>(null);

  const hasPosition = Number(vault.userShares) > 0;
  const hasStrategy = vault.strategy?.active ?? false;
  const hasAllowance = !vault.needsApproval;
  const currentStep = !hasPosition ? 1 : !hasAllowance ? 2 : !hasStrategy ? 3 : 4;
  const isOnboarded = hasPosition && hasStrategy;

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <TerminalHeader title="system: ready" subtitle="connect wallet to initialize" />
          <div className="p-8 text-center">
            <Cpu className="w-16 h-16 mx-auto mb-4 text-terminal-green/30" />
            <p className="text-terminal-muted font-mono text-sm">
              $ connect_wallet --rpc arbitrum_sepolia<br />
              <span className="text-terminal-green">Waiting for connection...</span>
            </p>
            <div className="mt-4 flex justify-center gap-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-terminal-green/50 animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TxToastContainer txs={txs} onDismiss={removeTx} updateTx={updateTx} />
      <Faucet onTx={addTx} />

      {/* Onboarding banner */}
      {!isOnboarded && (
        <div className="terminal-window p-4 border-terminal-magenta/30 bg-terminal-magenta/5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-terminal-magenta" />
            <span className="text-xs font-mono text-terminal-magenta uppercase tracking-wider">Welcome to YieldMind</span>
          </div>
          <p className="text-[11px] font-mono text-terminal-muted">
            {!hasPosition
              ? "Start by depositing USDC into the vault. You'll get shares representing your stake."
              : !hasAllowance
                ? "Approve USDC spending to complete your deposit setup."
                : "Set your yield strategy. Choose from presets, tune sliders, or let our AI advisor configure it for you."}
          </p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard icon={<Wallet className="w-5 h-5" />} label="Your Vault" value={`$${vault.userValue.toFixed(2)}`} />
          <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Share Price" value={`$${vault.sharePrice.toFixed(6)}`} accent="cyan" />
          <StatCard icon={<Activity className="w-5 h-5" />} label="TVL" value={`$${Number(vault.totalAssets).toLocaleString()}`} />
          <StatCard icon={<Shield className="w-5 h-5" />} label="Network"
            value={CHAIN_LABELS[chainId]?.replace(" ", "\n") ?? "Unknown"} accent="magenta" />
        </div>
        <div className="terminal-window p-4 border-terminal-magenta/30">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-3 h-3 text-terminal-magenta" />
            <p className="stat-label">Quick Start</p>
          </div>
          <div className="space-y-2">
            <QuickStartCard step={1} title="1. Deposit" desc="Add USDC to vault" active={currentStep === 1} done={hasPosition && hasAllowance} />
            <QuickStartCard step={2} title="2. Strategy" desc="Set allocation + risk" active={currentStep === 3} done={hasStrategy} />
            <QuickStartCard step={3} title="3. Earn" desc="Agent rebalances for you" active={currentStep === 4} done={false} />
          </div>
        </div>
      </div>

      {/* Main content: Leaderboard | Vault+Strategy | Position+Agent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Leaderboard */}
        <div className="space-y-4">
          <Leaderboard onCopy={(alloc, risk) => setCopiedStrategy({ allocationPct: alloc, riskLevel: risk })} />
        </div>

        {/* Center: VaultManager + StrategyForm + Chart */}
        <div className="lg:col-span-2 space-y-6">
          <PortfolioChart currentValue={vault.userValue} sharePrice={vault.sharePrice} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <VaultManager vault={vault} onTx={addTx} />
            <StrategyForm vault={vault} onTx={addTx} copyStrategy={copiedStrategy} copiedStrategy={setCopiedStrategy} />
          </div>
          {/* Position+Agent in a row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PositionCard vault={vault} />
            <div>
              <TerminalHeader title="agent.log" subtitle="tail -f /var/log/yieldmind/agent.log" />
              <div className="terminal-window p-4 h-[180px] overflow-y-auto">
                <div className="space-y-2 font-mono text-xs">
                  <p className="text-terminal-green">[INFO] Agent on {CHAIN_LABELS[chainId] ?? "Unknown"}</p>
                  {hasPosition && <p className="text-terminal-cyan">[ACTION] Position: ${vault.userValue.toFixed(2)}</p>}
                  {!hasPosition && <p className="text-terminal-muted">[INFO] No deposits yet...</p>}
                  {hasStrategy && (
                    <>
                      <p className="text-terminal-green">[STRATEGY] {Number(vault.strategy!.allocationBps) / 100}% growth · {RISK_LABELS[vault.strategy!.riskLevel] ?? vault.strategy!.riskLevel}</p>
                      <p className="text-terminal-muted">[CRON] Next check in ~5 min</p>
                    </>
                  )}
                  {vault.txPending && <p className="text-terminal-amber">[WARN] Transaction pending...</p>}
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-terminal-border">
                    <span className="text-terminal-green animate-pulse">●</span>
                    <span className="text-terminal-muted">Listening...</span>
                    <span className="text-terminal-muted cursor-blink" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
