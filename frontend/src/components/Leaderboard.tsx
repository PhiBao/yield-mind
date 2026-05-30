"use client";

import { useEffect, useState } from "react";
import { TerminalHeader } from "./TerminalHeader";
import { Trophy, Copy, Zap, Shield, TrendingUp, Loader2 } from "lucide-react";

interface LeaderEntry {
  address: string;
  shares: string;
  value: number;
  allocationPct: number;
  riskLevel: number;
  riskLabel: string;
  active: boolean;
}

export function Leaderboard({ onCopy }: { onCopy: (allocationPct: number, riskLevel: number) => void }) {
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const agentUrl = typeof window !== "undefined" ? (process.env as Record<string, string | undefined>).NEXT_PUBLIC_AGENT_URL : undefined;

  useEffect(() => {
    if (!agentUrl) { setLoading(false); return; }
    fetch(`${agentUrl}/api/leaderboard`)
      .then(r => r.json())
      .then(data => { if (data.entries) setEntries(data.entries); else setError(data.error || "No data"); })
      .catch(() => setError("Agent unreachable"))
      .finally(() => setLoading(false));
  }, [agentUrl]);

  const fmtAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const rankColor = (i: number) =>
    i === 0 ? "text-amber-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-amber-700" : "text-terminal-muted";

  if (!agentUrl) {
    return (
      <div className="terminal-window overflow-hidden">
        <TerminalHeader title="leaderboard.ts" subtitle="$ yieldmind leaderboard --top 10" />
        <div className="p-4 text-center">
          <p className="text-[10px] font-mono text-terminal-muted">
            Leaderboard requires the agent. Set NEXT_PUBLIC_AGENT_URL to enable rankings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="terminal-window overflow-hidden">
      <TerminalHeader title="leaderboard.ts" subtitle="$ yieldmind leaderboard --top 10" />
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-terminal-muted">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-[10px] font-mono">Loading rankings...</span>
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <Trophy className="w-8 h-8 mx-auto mb-2 text-terminal-muted/30" />
            <p className="text-[10px] font-mono text-terminal-muted">{error}</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-6">
            <Trophy className="w-8 h-8 mx-auto mb-2 text-terminal-muted/30" />
            <p className="text-[10px] font-mono text-terminal-muted">No positions yet. Be the first!</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {entries.slice(0, 10).map((e, i) => (
              <div key={e.address}
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-terminal-gray/20 border border-terminal-border hover:border-terminal-green/30 transition-all">
                <span className={`text-xs font-mono font-bold w-5 ${rankColor(i)}`}>#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono truncate">{fmtAddr(e.address)}</span>
                    {e.active && <span className="text-[8px] px-1 rounded bg-terminal-green/20 text-terminal-green font-mono uppercase">Active</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-mono text-terminal-muted">
                      <TrendingUp className="w-2.5 h-2.5 inline mr-0.5" />{e.allocationPct}% growth
                    </span>
                    <span className="text-[9px] font-mono text-terminal-muted">· {e.riskLabel}</span>
                  </div>
                </div>
                <div className="text-right flex items-center gap-2">
                  <span className="text-[11px] font-bold font-mono text-terminal-green">${e.value.toFixed(2)}</span>
                  {e.active && (
                    <button onClick={() => onCopy(e.allocationPct, e.riskLevel)}
                      className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-mono bg-terminal-cyan/10 border border-terminal-cyan/30 text-terminal-cyan hover:bg-terminal-cyan/20 transition-all">
                      <Copy className="w-2.5 h-2.5" />Copy
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
