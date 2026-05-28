"use client";

import { useState } from "react";
import { useAccount, useWriteContract  } from "wagmi";
import { useChainId } from "wagmi";
import { getUsdcAddress, getVaultAddress } from "@/lib/contracts";
import { parseUnits } from "viem";
import { Droplets, Loader2 } from "lucide-react";

const MOCK_USDC_ABI = [
  {
    type: "function",
    name: "mint",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
    stateMutability: "nonpayable",
  },
] as const;

const FAUCET_AMOUNT = "1000";

export function Faucet({ onTx }: { onTx: (hash: `0x${string}`, label: string) => void }) {
  const chainId = useChainId();
  const { address } = useAccount();
  const [loading, setLoading] = useState(false);
  const { writeContractAsync } = useWriteContract();

  if (chainId !== 46630 || !address) return null;

  const usdcAddress = getUsdcAddress(chainId);
  const vaultAddress = getVaultAddress(chainId);

  const handleMint = async () => {
    setLoading(true);
    try {
      const amount = parseUnits(FAUCET_AMOUNT, 6);
      const hash = await writeContractAsync({
        address: usdcAddress,
        abi: MOCK_USDC_ABI,
        functionName: "mint",
        args: [address, amount],
      });
      onTx(hash, `Faucet minted ${FAUCET_AMOUNT} USDC`);
    } catch (err: any) {
      console.error("Mint failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMintAndApprove = async () => {
    setLoading(true);
    try {
      const amount = parseUnits(FAUCET_AMOUNT, 6);
      const hash = await writeContractAsync({
        address: usdcAddress,
        abi: MOCK_USDC_ABI,
        functionName: "mint",
        args: [address, amount],
      });
      onTx(hash, `Faucet minted ${FAUCET_AMOUNT} USDC`);

      const approveHash = await writeContractAsync({
        address: usdcAddress,
        abi: MOCK_USDC_ABI,
        functionName: "approve",
        args: [vaultAddress, amount],
      });
      onTx(approveHash, "Approved vault to spend USDC");
    } catch (err: any) {
      console.error("Mint+Approve failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="terminal-window overflow-hidden">
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-terminal-cyan" />
          <span className="text-xs font-mono text-terminal-cyan uppercase tracking-wider">RHC Testnet Faucet</span>
        </div>

        <p className="text-[10px] font-mono text-terminal-muted">
          This is a mock USDC token for testing on Robinhood Testnet. Mint test tokens and pre-approve the vault in one click.
        </p>

        <div className="flex gap-2">
          <button
            onClick={handleMint}
            disabled={loading}
            className="btn-cyber flex-1 flex items-center justify-center gap-1.5 text-xs py-2"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Droplets className="w-3 h-3" />}
            Mint {FAUCET_AMOUNT} USDC
          </button>
          <button
            onClick={handleMintAndApprove}
            disabled={loading}
            className="btn-cyber-magenta flex-1 flex items-center justify-center gap-1.5 text-xs py-2"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Droplets className="w-3 h-3" />}
            Mint + Approve
          </button>
        </div>
      </div>
    </div>
  );
}
