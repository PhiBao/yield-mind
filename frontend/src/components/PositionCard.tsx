"use client";

import { useVaultData } from "@/hooks/useVault";
import { TerminalHeader } from "./TerminalHeader";
import { Wallet, TrendingUp, Gauge, Activity, Target } from "lucide-react";

const RISK_LABELS = ["Minimal", "Conservative", "Moderate", "Aggressive", "High Yield"];

function estimateAPY(allocationPct: number): { low: number; high: number } {
  if (allocationPct <= 20) return { low: 3, high: 6 };
  if (allocationPct <= 50) return { low: 5, high: 12 };
  if (allocationPct <= 80) return { low: 8, high: 20 };
  return { low: 12, high: 35 };
}

export function PositionCard({ vault }: { vault: ReturnType<typeof useVaultData> }) {
  const hasPosition = Number(vault.userShares) > 0;
  const strategy = vault.strategy;
  const allocationPct = strategy ? Number(strategy.allocationBps) / 100 : 0;
  const apy = strategy?.active ? estimateAPY(allocationPct) : null;
  const value = vault.userValue;

  return (
    <div className="terminal-window overflow-hidden">
      <TerminalHeader title="position.sol" subtitle="$ yieldmind position --user $(whoami)" />
      <div className="p-4 space-y-4">
        {!hasPosition ? (
          <div className="text-center py-6">
            <Wallet className="w-10 h-10 mx-auto mb-3 text-terminal-muted/40" />
            <p className="text-xs font-mono text-terminal-muted">No active position</p>
            <p className="text-[10px] font-mono text-terminal-muted/50 mt-1">Deposit USDC to start earning</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-terminal-gray/30 border border-terminal-border">
                <p className="text-[10px] font-mono text-terminal-muted uppercase tracking-wider">Value</p>
                <p className="text-sm font-bold font-mono text-terminal-green mt-1">${value.toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-lg bg-terminal-gray/30 border border-terminal-border">
                <p className="text-[10px] font-mono text-terminal-muted uppercase tracking-wider">Shares</p>
                <p className="text-sm font-bold font-mono text-terminal-cyan mt-1">{Number(vault.userShares).toFixed(4)}</p>
              </div>
            </div>

            {apy && (
              <div className="p-3 rounded-lg bg-terminal-cyan/5 border border-terminal-cyan/20">
                <div className="flex items-center gap-1.5 mb-1">
                  <Target className="w-3 h-3 text-terminal-cyan" />
                  <span className="text-[10px] font-mono text-terminal-cyan uppercase tracking-wider">Estimated APY</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold font-mono text-terminal-cyan">{apy.low}–{apy.high}%</span>
                  <span className="text-[9px] font-mono text-terminal-muted">based on {allocationPct}% growth allocation</span>
                </div>
              </div>
            )}

            {strategy && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Gauge className="w-3 h-3 text-terminal-muted" />
                  <span className="text-[10px] font-mono text-terminal-muted uppercase tracking-wider">Strategy</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 rounded bg-terminal-gray/20 border border-terminal-border">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-3 h-3 text-terminal-cyan" />
                    <span className="text-[11px] font-mono text-terminal-muted">Growth</span>
                  </div>
                  <span className="text-xs font-mono text-terminal-green">{allocationPct}%</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 rounded bg-terminal-gray/20 border border-terminal-border">
                  <div className="flex items-center gap-2">
                    <Activity className="w-3 h-3 text-terminal-magenta" />
                    <span className="text-[11px] font-mono text-terminal-muted">Risk</span>
                  </div>
                  <span className="text-xs font-mono text-terminal-cyan">{RISK_LABELS[strategy.riskLevel] ?? `Level ${strategy.riskLevel}`}</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-[10px] font-mono text-terminal-muted">
              <div className={`w-1.5 h-1.5 rounded-full ${strategy?.active ? "bg-terminal-green animate-pulse" : "bg-terminal-amber"}`} />
              {strategy?.active ? "Agent monitoring · rebalances every 5 min" : "Strategy inactive"}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
