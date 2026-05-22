"use client";

import { useState } from "react";
import { TerminalHeader } from "./TerminalHeader";
import { useVaultData } from "@/hooks/useVault";
import { Sliders, Loader2, Brain, CheckCircle } from "lucide-react";

const RISK_LABELS = ["Minimal", "Conservative", "Moderate", "Aggressive", "High Yield"];

export function StrategyForm({ vault, onTx }: { vault: ReturnType<typeof useVaultData>; onTx: (hash: `0x${string}`, label: string) => void }) {
  const [allocation, setAllocation] = useState(50);
  const [riskLevel, setRiskLevel] = useState(2);
  const [nlInput, setNlInput] = useState("");
  const [showNl, setShowNl] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    setLoading(true);
    try {
      const allocationBps = allocation * 100;
      const hash = await vault.setStrategy(allocationBps, riskLevel);
      if (hash) onTx(hash, "Set strategy: " + allocation + "% growth, " + RISK_LABELS[riskLevel]);
      vault.refetch();
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const parseStrategyLocally = (input: string): { allocationBps: number; riskLevel: number } => {
    const words = input.toLowerCase();
    if (words.includes("safe") || words.includes("stable") || words.includes("low risk") || words.includes("conservative")) {
      return { allocationBps: 2000, riskLevel: 0 };
    }
    if (words.includes("balanced") || words.includes("moderate")) {
      return { allocationBps: 5000, riskLevel: 2 };
    }
    if (words.includes("aggressive") || words.includes("high") || words.includes("yield") || words.includes("growth") || words.includes("grow")) {
      return { allocationBps: 8000, riskLevel: 4 };
    }
    if (words.includes("max") || words.includes("extreme") || words.includes("degen") || words.includes("full")) {
      return { allocationBps: 9500, riskLevel: 4 };
    }
    return { allocationBps: 5000, riskLevel: 2 };
  };

  const handleNaturalLanguage = async () => {
    if (!nlInput.trim()) return;
    setLoading(true);
    try {
      const agentUrl = typeof process !== "undefined" ? (process.env as Record<string, string | undefined>).NEXT_PUBLIC_AGENT_URL : undefined;

      let newAlloc: number;
      let newRisk: number;

      if (agentUrl) {
        const res = await fetch(`${agentUrl}/api/parse-strategy`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: nlInput }),
        });
        const data = await res.json() as { allocationBps: number; riskLevel: number };
        newAlloc = data.allocationBps / 100;
        newRisk = data.riskLevel;
      } else {
        const parsed = parseStrategyLocally(nlInput);
        newAlloc = parsed.allocationBps / 100;
        newRisk = parsed.riskLevel;
      }

      setAllocation(newAlloc);
      setRiskLevel(newRisk);

      const hash = await vault.setStrategy(newAlloc * 100, newRisk);
      if (hash) onTx(hash, "AI strategy: " + newAlloc + "% growth, " + RISK_LABELS[newRisk]);
      vault.refetch();
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="terminal-window overflow-hidden">
      <TerminalHeader title="strategy.ts" subtitle="$ yieldmind strategy --config" />
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-terminal-muted uppercase tracking-wider">Strategy Config</span>
          <button
            onClick={() => setShowNl(!showNl)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg border transition-all ${
              showNl
                ? "bg-terminal-magenta/10 border-terminal-magenta/30 text-terminal-magenta"
                : "bg-terminal-gray/30 border-terminal-border text-terminal-muted hover:border-terminal-muted/50"
            }`}
          >
            <Brain className="w-3 h-3" />
            AI
          </button>
        </div>

        {vault.strategy && (
          <div className="flex items-center gap-2 p-2 rounded bg-terminal-green/5 border border-terminal-green/20">
            <CheckCircle className="w-3 h-3 text-terminal-green shrink-0" />
            <span className="text-[10px] font-mono text-terminal-green">
              Active: {Number(vault.strategy.allocationBps) / 100}% growth · {RISK_LABELS[vault.strategy.riskLevel] ?? "N/A"}
            </span>
          </div>
        )}

        {showNl ? (
          <div className="space-y-3">
            <p className="text-[10px] font-mono text-terminal-muted">
              Describe your strategy. The AI agent will parse it and configure on-chain.
            </p>
            <textarea
              value={nlInput}
              onChange={(e) => setNlInput(e.target.value)}
              placeholder='e.g. "balanced growth with moderate risk, 60% stable / 40% growth"'
              className="input-cyber h-20 resize-none text-xs"
            />
            <button
              onClick={handleNaturalLanguage}
              disabled={!nlInput.trim() || loading || vault.txPending}
              className="btn-cyber-magenta w-full flex items-center justify-center gap-2 text-xs"
            >
              {loading ? (
                <><Loader2 className="w-3 h-3 animate-spin" /> Sending...</>
              ) : (
                <><Brain className="w-3 h-3" /> Parse & apply</>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-mono mb-2">
                <span className="text-terminal-muted">Stable / Growth Split</span>
                <span className="text-terminal-green">{allocation}% Growth</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={allocation}
                onChange={(e) => setAllocation(Number(e.target.value))}
                className="w-full h-1.5 bg-terminal-gray rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-terminal-green
                  [&::-webkit-slider-thumb]:shadow-glow [&::-webkit-slider-thumb]:cursor-pointer"
                style={{
                  background: `linear-gradient(90deg, #00e5ff 0%, #00ff41 ${allocation}%, #1e2448 ${allocation}%, #1e2448 100%)`,
                }}
              />
              <div className="flex justify-between text-[10px] font-mono text-terminal-muted mt-1">
                <span>100% Stable</span>
                <span>100% Growth</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-2">
                <span className="text-terminal-muted">Risk Level</span>
                <span className="text-terminal-cyan">{RISK_LABELS[riskLevel]}</span>
              </div>
              <div className="flex gap-1">
                {RISK_LABELS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setRiskLevel(i)}
                    className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                      i <= riskLevel ? "bg-terminal-cyan" : "bg-terminal-gray"
                    } ${i === riskLevel ? "shadow-glow-cyan" : ""}`}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={handleApply}
              disabled={loading || vault.txPending}
              className="btn-cyber w-full flex items-center justify-center gap-2 text-xs"
            >
              {loading ? (
                <><Loader2 className="w-3 h-3 animate-spin" /> Submitting...</>
              ) : (
                <><Sliders className="w-3 h-3" /> Apply Strategy</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
