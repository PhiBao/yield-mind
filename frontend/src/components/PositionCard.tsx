"use client";

import { useVaultData } from "@/hooks/useVault";
import { TerminalHeader } from "./TerminalHeader";
import { Wallet, TrendingUp, Gauge, Activity } from "lucide-react";

const RISK_LABELS = ["Minimal", "Conservative", "Moderate", "Aggressive", "High Yield"];

export function PositionCard({ vault }: { vault: ReturnType<typeof useVaultData> }) {
  const hasPosition = Number(vault.userShares) > 0;
  const strategy = vault.strategy;

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
                <p className="text-[10px] font-mono text-terminal-muted uppercase tracking-wider">Shares</p>
                <p className="text-sm font-bold font-mono text-terminal-green mt-1">
                  {Number(vault.userShares).toFixed(4)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-terminal-gray/30 border border-terminal-border">
                <p className="text-[10px] font-mono text-terminal-muted uppercase tracking-wider">Value</p>
                <p className="text-sm font-bold font-mono text-terminal-cyan mt-1">
                  ${vault.userValue.toFixed(2)}
                </p>
              </div>
            </div>

            {strategy && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Gauge className="w-3 h-3 text-terminal-muted" />
                  <span className="text-[10px] font-mono text-terminal-muted uppercase tracking-wider">Strategy</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 rounded bg-terminal-gray/20 border border-terminal-border">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-3 h-3 text-terminal-cyan" />
                    <span className="text-[11px] font-mono text-terminal-muted">Growth allocation</span>
                  </div>
                  <span className="text-xs font-mono text-terminal-green">{Number(strategy.allocationBps) / 100}%</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 rounded bg-terminal-gray/20 border border-terminal-border">
                  <div className="flex items-center gap-2">
                    <Activity className="w-3 h-3 text-terminal-magenta" />
                    <span className="text-[11px] font-mono text-terminal-muted">Risk level</span>
                  </div>
                  <span className="text-xs font-mono text-terminal-cyan">
                    {RISK_LABELS[strategy.riskLevel] ?? `Level ${strategy.riskLevel}`}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-[10px] font-mono text-terminal-muted">
              <div className={`w-1.5 h-1.5 rounded-full ${strategy?.active ? "bg-terminal-green" : "bg-terminal-amber"}`} />
              {strategy?.active ? "Strategy active — agent monitoring" : "Strategy inactive"}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
