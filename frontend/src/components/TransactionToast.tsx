"use client";

import { useEffect, useState } from "react";
import { useWaitForTransactionReceipt } from "wagmi";
import { CheckCircle, Loader2, XCircle, X } from "lucide-react";

export interface TxState {
  hash: `0x${string}` | null;
  label: string;
  status: "pending" | "confirming" | "confirmed" | "failed" | null;
}

export function useTxToast() {
  const [txs, setTxs] = useState<TxState[]>([]);

  const addTx = (hash: `0x${string}`, label: string) => {
    setTxs((prev) => [...prev, { hash, label, status: "pending" }]);
  };

  const removeTx = (hash: `0x${string}`) => {
    setTxs((prev) => prev.filter((t) => t.hash !== hash));
  };

  const updateTx = (hash: `0x${string}`, status: TxState["status"]) => {
    setTxs((prev) => prev.map((t) => (t.hash === hash ? { ...t, status } : t)));
  };

  return { txs, addTx, removeTx, updateTx };
}

export function TxNotification({
  tx,
  onDismiss,
  updateTx,
}: {
  tx: TxState;
  onDismiss: (hash: `0x${string}`) => void;
  updateTx: (hash: `0x${string}`, status: TxState["status"]) => void;
}) {
  const { isLoading, isSuccess, isError } = useWaitForTransactionReceipt({
    hash: tx.hash ?? undefined,
  });

  useEffect(() => {
    if (isLoading && tx.status === "pending") {
      updateTx(tx.hash!, "confirming");
    }
  }, [isLoading]);

  useEffect(() => {
    if (isSuccess) {
      updateTx(tx.hash!, "confirmed");
      const t = setTimeout(() => onDismiss(tx.hash!), 4000);
      return () => clearTimeout(t);
    }
  }, [isSuccess]);

  useEffect(() => {
    if (isError) {
      updateTx(tx.hash!, "failed");
    }
  }, [isError]);

  const bg =
    tx.status === "confirmed"
      ? "bg-terminal-green/10 border-terminal-green/30"
      : tx.status === "failed"
        ? "bg-terminal-red/10 border-terminal-red/30"
        : "bg-terminal-gray/50 border-terminal-border";

  const icon =
    tx.status === "confirmed" ? (
      <CheckCircle className="w-4 h-4 text-terminal-green" />
    ) : tx.status === "failed" ? (
      <XCircle className="w-4 h-4 text-terminal-red" />
    ) : (
      <Loader2 className="w-4 h-4 text-terminal-cyan animate-spin" />
    );

  const label =
    tx.status === "confirmed"
      ? "Confirmed"
      : tx.status === "failed"
        ? "Failed"
        : tx.status === "confirming"
          ? "Confirming..."
          : "Submitted";

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${bg} backdrop-blur-sm min-w-[300px]`}>
      {icon}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-mono text-terminal-muted">{tx.label}</p>
        <p className="text-[10px] font-mono text-terminal-muted/60 truncate">{tx.hash}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-mono ${tx.status === "confirmed" ? "text-terminal-green" : tx.status === "failed" ? "text-terminal-red" : "text-terminal-cyan"}`}>
          {label}
        </span>
        {tx.hash && (tx.status === "confirmed" || tx.status === "failed") && (
          <button onClick={() => onDismiss(tx.hash!)} className="text-terminal-muted hover:text-terminal-green transition-colors">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

export function TxToastContainer({ txs, onDismiss, updateTx }: { txs: TxState[]; onDismiss: (hash: `0x${string}`) => void; updateTx: (hash: `0x${string}`, status: TxState["status"]) => void }) {
  if (txs.length === 0) return null;
  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {txs.map((tx) => (
        <TxNotification key={tx.hash} tx={tx} onDismiss={onDismiss} updateTx={updateTx} />
      ))}
    </div>
  );
}
