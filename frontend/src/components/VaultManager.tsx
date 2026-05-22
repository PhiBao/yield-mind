"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useVaultData } from "@/hooks/useVault";
import { TerminalHeader } from "./TerminalHeader";
import { ApprovalGuard } from "./ApprovalGuard";
import { ArrowDownUp, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";

export function VaultManager({ vault, onTx }: { vault: ReturnType<typeof useVaultData>; onTx: (hash: `0x${string}`, label: string) => void }) {
  const { address } = useAccount();
  const [mode, setMode] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!amount || loading) return;
    setLoading(true);
    try {
      const hash = mode === "deposit"
        ? await vault.deposit(amount)
        : await vault.withdraw(amount);
      if (hash) onTx(hash, `${mode === "deposit" ? "Deposit" : "Withdraw"} ${amount} USDC`);
      setAmount("");
      vault.refetch();
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const setMax = () => {
    if (mode === "deposit") setAmount(vault.usdcBalance);
    else setAmount(vault.userValue.toFixed(2));
  };

  const canSubmit = amount && !loading && !vault.txPending && (mode === "withdraw" || !vault.needsApproval);

  return (
    <div className="terminal-window overflow-hidden">
      <TerminalHeader title={`${mode === "deposit" ? "deposit" : "withdraw"}.tsx`} subtitle={`$ yieldmind ${mode} --amount <value>`} />
      <div className="p-4 space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => setMode("deposit")}
            className={`flex-1 py-2 text-xs font-mono rounded-lg border transition-all duration-300 ${
              mode === "deposit"
                ? "bg-terminal-green/10 border-terminal-green/50 text-terminal-green glow-text"
                : "bg-terminal-gray/30 border-terminal-border text-terminal-muted hover:border-terminal-muted/50"
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <ArrowUpRight className="w-3 h-3" />
              Deposit
            </div>
          </button>
          <button
            onClick={() => setMode("withdraw")}
            className={`flex-1 py-2 text-xs font-mono rounded-lg border transition-all duration-300 ${
              mode === "withdraw"
                ? "bg-terminal-cyan/10 border-terminal-cyan/50 text-terminal-cyan glow-text-cyan"
                : "bg-terminal-gray/30 border-terminal-border text-terminal-muted hover:border-terminal-muted/50"
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <ArrowDownRight className="w-3 h-3" />
              Withdraw
            </div>
          </button>
        </div>

        <div className="flex items-center justify-between text-xs font-mono text-terminal-muted px-1">
          <span>USDC: {vault.usdcBalance}</span>
          {mode === "withdraw" && <span>Vault: ${vault.userValue.toFixed(2)}</span>}
        </div>

        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="input-cyber pr-16"
          />
          <button onClick={setMax} className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] font-mono text-terminal-cyan border border-terminal-cyan/30 rounded hover:bg-terminal-cyan/10 transition-all">
            MAX
          </button>
        </div>

        {mode === "deposit" && <ApprovalGuard vault={vault} />}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="btn-cyber w-full flex items-center justify-center gap-2"
        >
          {loading || vault.txPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
          ) : (
            <><ArrowDownUp className="w-4 h-4" /> {mode === "deposit" ? "Deposit USDC" : "Withdraw USDC"}</>
          )}
        </button>
      </div>
    </div>
  );
}
