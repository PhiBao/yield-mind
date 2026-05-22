"use client";

import { useReadContract, useWriteContract, useAccount } from "wagmi";
import { VAULT_ADDRESS, VAULT_ABI, STRATEGY_REGISTRY_ADDRESS, STRATEGY_REGISTRY_ABI, ERC20_ABI, USDC_ADDRESSES } from "@/lib/contracts";
import { formatUnits, parseUnits, type Address } from "viem";
import { useState, useCallback } from "react";
import type { StrategyData } from "@/types";

export function useVaultData() {
  const { address, chainId } = useAccount();
  const [txPending, setTxPending] = useState(false);

  const usdcAddress = (chainId ? USDC_ADDRESSES[chainId] : undefined) ?? "0x";

  const { data: totalAssets, refetch: refetchAssets } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "totalAssets",
    query: { refetchInterval: 15_000 },
  });

  const { data: totalSupply } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "totalSupply",
    query: { refetchInterval: 15_000 },
  });

  const { data: userShares, refetch: refetchShares } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 15_000 },
  });

  const { data: usdcBalance } = useReadContract({
    address: usdcAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 15_000 },
  });

  const { data: usdcAllowance, refetch: refetchAllowance } = useReadContract({
    address: usdcAddress,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, VAULT_ADDRESS] : undefined,
    query: { enabled: !!address, refetchInterval: 10_000 },
  });

  const { data: userStrategy, refetch: refetchStrategy } = useReadContract({
    address: STRATEGY_REGISTRY_ADDRESS,
    abi: STRATEGY_REGISTRY_ABI,
    functionName: "getStrategy",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { writeContractAsync } = useWriteContract();

  const deposit = useCallback(async (amount: string): Promise<`0x${string}`> => {
    if (!address) throw new Error("Wallet not connected");
    setTxPending(true);
    try {
      const assets = parseUnits(amount, 6);
      const hash = await writeContractAsync({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "deposit",
        args: [assets, address],
      });
      return hash;
    } finally {
      setTxPending(false);
    }
  }, [address, writeContractAsync]);

  const withdraw = useCallback(async (amount: string): Promise<`0x${string}`> => {
    if (!address) throw new Error("Wallet not connected");
    setTxPending(true);
    try {
      const assets = parseUnits(amount, 6);
      const hash = await writeContractAsync({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "withdraw",
        args: [assets, address, address],
      });
      return hash;
    } finally {
      setTxPending(false);
    }
  }, [address, writeContractAsync]);

  const approve = useCallback(async (amount: string): Promise<`0x${string}`> => {
    if (!address) throw new Error("Wallet not connected");
    setTxPending(true);
    try {
      const hash = await writeContractAsync({
        address: usdcAddress as Address,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [VAULT_ADDRESS, parseUnits(amount, 6)],
      });
      return hash;
    } finally {
      setTxPending(false);
    }
  }, [address, usdcAddress, writeContractAsync]);

  const setStrategy = useCallback(async (allocationBps: number, riskLevel: number) => {
    if (!address) throw new Error("Wallet not connected");
    setTxPending(true);
    try {
      const hash = await writeContractAsync({
        address: STRATEGY_REGISTRY_ADDRESS,
        abi: STRATEGY_REGISTRY_ABI,
        functionName: "setStrategy",
        args: [address, { allocationBps: BigInt(allocationBps), riskLevel, rebalanceThreshold: BigInt(100), active: true }],
      });
      return hash;
    } finally {
      setTxPending(false);
    }
  }, [address, writeContractAsync]);

  const getSharePrice = (): number => {
    if (!totalAssets || !totalSupply || totalSupply === 0n) return 1;
    return Number(formatUnits(totalAssets, 6)) / Number(formatUnits(totalSupply, 6));
  };

  const getUserValue = (): number => {
    if (!userShares || !totalAssets || !totalSupply || totalSupply === 0n) return 0;
    return Number(formatUnits(userShares, 6)) * getSharePrice();
  };

  const usdcFormatted = usdcBalance ? (Number(usdcBalance) / 1e6).toFixed(2) : "0.00";
  const allowanceFormatted = usdcAllowance ? (Number(usdcAllowance) / 1e6).toFixed(2) : "0.00";
  const needsApproval = usdcAllowance !== undefined && usdcAllowance < (parseUnits("1000", 6));

  const strategy: StrategyData | null = (() => {
    if (!userStrategy) return null;
    const s = userStrategy as unknown as { allocationBps: bigint; riskLevel: number; rebalanceThreshold: bigint; active: boolean };
    return { allocationBps: s.allocationBps, riskLevel: Number(s.riskLevel), rebalanceThreshold: s.rebalanceThreshold, active: s.active };
  })();

  const refetch = () => {
    refetchAssets();
    refetchShares();
    refetchAllowance();
    refetchStrategy();
  };

  return {
    totalAssets: totalAssets ? formatUnits(totalAssets, 6) : "0",
    totalSupply: totalSupply ? formatUnits(totalSupply, 6) : "0",
    userShares: userShares ? formatUnits(userShares, 6) : "0",
    userValue: getUserValue(),
    sharePrice: getSharePrice(),
    usdcBalance: usdcFormatted,
    usdcAllowance: allowanceFormatted,
    needsApproval,
    strategy,
    txPending,
    deposit,
    withdraw,
    approve,
    setStrategy,
    refetch,
  };
}
