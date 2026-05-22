"use client";

import { useVaultData } from "@/hooks/useVault";
import { Loader2, ShieldCheck, ShieldAlert } from "lucide-react";
import { useState } from "react";

export function ApprovalGuard({ vault }: { vault: ReturnType<typeof useVaultData> }) {
  const [approving, setApproving] = useState(false);
  const [done, setDone] = useState(false);

  if (done) return null;
  if (!vault.needsApproval) return null;

  const handleApprove = async () => {
    setApproving(true);
    try {
      await vault.approve("1000000");
      setDone(true);
      vault.refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-terminal-amber/30 bg-terminal-amber/5">
      <ShieldAlert className="w-5 h-5 text-terminal-amber shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-mono text-terminal-amber">USDC approval required</p>
        <p className="text-[10px] font-mono text-terminal-muted">
          Allow YieldMind to withdraw your USDC
        </p>
      </div>
      <button
        onClick={handleApprove}
        disabled={approving}
        className="btn-cyber text-xs px-4 py-1.5 shrink-0 flex items-center gap-1.5"
      >
        {approving ? (
          <><Loader2 className="w-3 h-3 animate-spin" /> Approving...</>
        ) : (
          <><ShieldCheck className="w-3 h-3" /> Approve</>
        )}
      </button>
    </div>
  );
}
