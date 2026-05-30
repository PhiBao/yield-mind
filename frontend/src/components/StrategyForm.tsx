"use client";

import { useState, useEffect } from "react";
import { TerminalHeader } from "./TerminalHeader";
import { useVaultData } from "@/hooks/useVault";
import { Sliders, Loader2, Brain, CheckCircle, Sparkles, ShieldCheck, Zap, Rocket } from "lucide-react";

const RISK_LABELS = ["Minimal", "Conservative", "Moderate", "Aggressive", "High Yield"];

interface Template {
  name: string;
  desc: string;
  alloc: number;
  risk: number;
  icon: React.ReactNode;
  color: string;
}

const TEMPLATES: Template[] = [
  { name: "Stable Yield", desc: "Capital preservation", alloc: 20, risk: 0, icon: <ShieldCheck className="w-3 h-3" />, color: "border-blue-400/30 text-blue-400" },
  { name: "Balanced", desc: "50/50 split", alloc: 50, risk: 2, icon: <Sliders className="w-3 h-3" />, color: "border-cyan-400/30 text-cyan-400" },
  { name: "Growth", desc: "Yield maximizing", alloc: 80, risk: 3, icon: <Zap className="w-3 h-3" />, color: "border-amber-400/30 text-amber-400" },
  { name: "DeFi Degen", desc: "Full send", alloc: 95, risk: 4, icon: <Rocket className="w-3 h-3" />, color: "border-magenta-400/30 text-magenta-400" },
];

export function StrategyForm({ vault, onTx, copyStrategy, copiedStrategy }: {
  vault: ReturnType<typeof useVaultData>;
  onTx: (hash: `0x${string}`, label: string) => void;
  copyStrategy?: { allocationPct: number; riskLevel: number } | null;
  copiedStrategy: React.Dispatch<React.SetStateAction<{ allocationPct: number; riskLevel: number } | null>>;
}) {
  const [allocation, setAllocation] = useState(50);
  const [riskLevel, setRiskLevel] = useState(2);
  const [nlInput, setNlInput] = useState("");
  const [showNl, setShowNl] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reasoning, setReasoning] = useState("");

  useEffect(() => {
    if (copyStrategy) {
      setAllocation(copyStrategy.allocationPct);
      setRiskLevel(copyStrategy.riskLevel);
    }
  }, [copyStrategy]);

  const agentUrl = typeof window !== "undefined" ? (process.env as Record<string, string | undefined>).NEXT_PUBLIC_AGENT_URL : undefined;

  const applyTemplate = (t: Template) => { setAllocation(t.alloc); setRiskLevel(t.risk); };

  const handleApply = async () => {
    setLoading(true);
    try {
      const hash = await vault.setStrategy(allocation * 100, riskLevel);
      if (hash) onTx(hash, `Strategy: ${allocation}% growth · ${RISK_LABELS[riskLevel]}`);
      vault.refetch();
    } finally {
      setLoading(false);
    }
  };

  const handleAdvisor = async () => {
    if (!nlInput.trim()) return;
    setLoading(true);
    setReasoning("");
    try {
      let result: { allocationBps: number; riskLevel: number; reasoning?: string };
      if (agentUrl) {
        const res = await fetch(`${agentUrl}/api/parse-strategy`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: nlInput, portfolioValue: vault.userValue }),
        });
        result = await res.json() as typeof result;
      } else {
        const words = nlInput.toLowerCase();
        if (words.includes("safe") || words.includes("stable")) result = { allocationBps: 2000, riskLevel: 0, reasoning: "Conservative allocation, 20% growth." };
        else if (words.includes("balanced")) result = { allocationBps: 5000, riskLevel: 2, reasoning: "50/50 split for moderate risk." };
        else if (words.includes("degen") || words.includes("max")) result = { allocationBps: 9500, riskLevel: 4, reasoning: "Maximum growth exposure." };
        else if (words.includes("aggressive") || words.includes("growth")) result = { allocationBps: 8000, riskLevel: 4, reasoning: "Growth-oriented strategy." };
        else result = { allocationBps: 5000, riskLevel: 2, reasoning: "Balanced default strategy." };
      }

      const alloc = result.allocationBps / 100;
      setAllocation(alloc);
      setRiskLevel(result.riskLevel);
      if (result.reasoning) setReasoning(result.reasoning);
      setShowNl(false);

      const hash = await vault.setStrategy(result.allocationBps, result.riskLevel);
      if (hash) onTx(hash, `AI: ${alloc}% · ${RISK_LABELS[result.riskLevel]}`);
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
          <span className="text-xs font-mono text-terminal-muted uppercase tracking-wider">Strategy</span>
          <button
            onClick={() => { setShowNl(!showNl); setReasoning(""); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg border transition-all ${
              showNl ? "bg-terminal-magenta/10 border-terminal-magenta/30 text-terminal-magenta" : "bg-terminal-gray/30 border-terminal-border text-terminal-muted hover:border-terminal-muted/50"
            }`}
          ><Brain className="w-3 h-3" />AI Advisor</button>
        </div>

        {vault.strategy && (
          <div className="flex items-center gap-2 p-2 rounded bg-terminal-green/5 border border-terminal-green/20">
            <CheckCircle className="w-3 h-3 text-terminal-green shrink-0" />
            <span className="text-[10px] font-mono text-terminal-green">
              Active: {Number(vault.strategy.allocationBps) / 100}% growth · {RISK_LABELS[vault.strategy.riskLevel] ?? "N/A"}
            </span>
          </div>
        )}

        {/* Strategy Templates */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono text-terminal-muted/70 uppercase">Presets</span>
          <div className="grid grid-cols-2 gap-1.5">
            {TEMPLATES.map((t) => (
              <button
                key={t.name}
                onClick={() => applyTemplate(t)}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border bg-terminal-gray/20 text-left transition-all hover:bg-terminal-gray/40 ${t.color} ${allocation === t.alloc && riskLevel === t.risk ? "ring-1 ring-terminal-green/50" : ""}`}
              >
                {t.icon}
                <div>
                  <span className="text-[10px] font-mono block">{t.name}</span>
                  <span className="text-[9px] opacity-60">{t.alloc}% growth</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {showNl ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-terminal-magenta">
              <Sparkles className="w-3 h-3" />
              <span className="text-[10px] font-mono uppercase">AI Strategy Advisor</span>
            </div>
            <p className="text-[10px] font-mono text-terminal-muted">
              Describe your goals, risk appetite, time horizon. The AI will recommend and apply a strategy on-chain.
            </p>
            <textarea value={nlInput} onChange={(e) => setNlInput(e.target.value)}
              placeholder='"I want aggressive growth with high risk — 80% in yield assets, 3 month horizon"'
              className="input-cyber h-20 resize-none text-xs" />
            {reasoning && (
              <div className="p-2 rounded bg-terminal-green/5 border border-terminal-green/20 text-[10px] font-mono text-terminal-green">
                {reasoning}
              </div>
            )}
            <button onClick={handleAdvisor} disabled={!nlInput.trim() || loading || vault.txPending}
              className="btn-cyber-magenta w-full flex items-center justify-center gap-2 text-xs">
              {loading ? <><Loader2 className="w-3 h-3 animate-spin" /> Analyzing...</> : <><Sparkles className="w-3 h-3" /> Apply AI Strategy</>}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Copied strategy indicator */}
            {copyStrategy && (
              <div className="flex items-center gap-2 p-2 rounded bg-terminal-magenta/5 border border-terminal-magenta/20">
                <Sparkles className="w-3 h-3 text-terminal-magenta shrink-0" />
                <span className="text-[10px] font-mono text-terminal-magenta">
                  Copying: {copyStrategy.allocationPct}% growth · {RISK_LABELS[copyStrategy.riskLevel] ?? "N/A"}
                </span>
                <button onClick={() => copiedStrategy(null)} className="ml-auto text-[9px] text-terminal-muted hover:text-terminal-red">clear</button>
              </div>
            )}
            <div>
              <div className="flex justify-between text-xs font-mono mb-2">
                <span className="text-terminal-muted">Stable / Growth Split</span>
                <span className="text-terminal-green">{allocation}% Growth</span>
              </div>
              <input type="range" min={0} max={100} value={allocation} onChange={(e) => setAllocation(Number(e.target.value))}
                className="w-full h-1.5 bg-terminal-gray rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-terminal-green
                  [&::-webkit-slider-thumb]:shadow-glow [&::-webkit-slider-thumb]:cursor-pointer"
                style={{ background: `linear-gradient(90deg, #00e5ff 0%, #00ff41 ${allocation}%, #1e2448 ${allocation}%, #1e2448 100%)` }} />
              <div className="flex justify-between text-[10px] font-mono text-terminal-muted mt-1">
                <span>100% Stable</span><span>100% Growth</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-mono mb-2">
                <span className="text-terminal-muted">Risk Level</span>
                <span className="text-terminal-cyan">{RISK_LABELS[riskLevel]}</span>
              </div>
              <div className="flex gap-1">
                {RISK_LABELS.map((_, i) => (
                  <button key={i} onClick={() => setRiskLevel(i)}
                    className={`flex-1 h-2 rounded-full transition-all duration-300 ${i <= riskLevel ? "bg-terminal-cyan" : "bg-terminal-gray"} ${i === riskLevel ? "shadow-glow-cyan" : ""}`} />
                ))}
              </div>
            </div>
            <button onClick={handleApply} disabled={loading || vault.txPending}
              className="btn-cyber w-full flex items-center justify-center gap-2 text-xs">
              {loading ? <><Loader2 className="w-3 h-3 animate-spin" /> Submitting...</> : <><Sliders className="w-3 h-3" /> Apply Strategy</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
