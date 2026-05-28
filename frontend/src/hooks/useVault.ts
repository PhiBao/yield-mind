"use client";

import { useReadContract, useWriteContract, useAccount } from "wagmi";
import { getVaultAddress, VAULT_ABI, getStrategyRegistryAddress, STRATEGY_REGISTRY_ABI, ERC20_ABI, getUsdcAddress } from "@/lib/contracts";
import { formatUnits, parseUnits, type Address } from "viem";
import { useState, useCallback } from "react";
import type { StrategyData } from "@/types";

export function useVaultData() {
  const { address, chainId } = useAccount();
  const [txPending, setTxPending] = useState(false);

  const vaultAddress = getVaultAddress(chainId ?? 0);
  const registryAddress = getStrategyRegistryAddress(chainId ?? 0);
  const usdcAddress = getUsdcAddress(chainId ?? 0);
  const isSupported = chainId ? vaultAddress !== "0x" && registryAddress !== "0x" : false;

  const { data: totalAssets, refetch: refetchAssets } = useReadContract({
    address: vaultAddress,
    abi: VAULT_ABI,
    functionName: "totalAssets",
    query: { enabled: isSupported, refetchInterval: 15_000 },
  });

  const { data: totalSupply } = useReadContract({
    address: vaultAddress,
    abi: VAULT_ABI,
    functionName: "totalSupply",
    query: { enabled: isSupported, refetchInterval: 15_000 },
  });

  const { data: userShares, refetch: refetchShares } = useReadContract({
    address: vaultAddress,
    abi: VAULT_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && isSupported, refetchInterval: 15_000 },
  });

  const { data: usdcBalance } = useReadContract({
    address: usdcAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && usdcAddress !== "0x", refetchInterval: 15_000 },
  });

  const { data: usdcAllowance, refetch: refetchAllowance } = useReadContract({
    address: usdcAddress,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, vaultAddress] : undefined,
    query: { enabled: !!address && isSupported, refetchInterval: 10_000 },
  });

  const { data: userStrategy, refetch: refetchStrategy } = useReadContract({
    address: registryAddress,
    abi: STRATEGY_REGISTRY_ABI,
    functionName: "getStrategy",
    args: address ? [address] : undefined,
    query: { enabled: !!address && isSupported },
  });

  const { writeContractAsync } = useWriteContract();

  const deposit = useCallback(async (amount: string): Promise<`0x${string}`> => {
    if (!address) throw new Error("Wallet not connected");
    setTxPending(true);
    try {
      const assets = parseUnits(amount, 6);
      const hash = await writeContractAsync({
        address: vaultAddress,
        abi: VAULT_ABI,
        functionName: "deposit",
        args: [assets, address],
      });
      return hash;
    } finally {
      setTxPending(false);
    }
  }, [address, vaultAddress, writeContractAsync]);

  const withdraw = useCallback(async (amount: string): Promise<`0x${string}`> => {
    if (!address) throw new Error("Wallet not connected");
    setTxPending(true);
    try {
      const assets = parseUnits(amount, 6);
      const hash = await writeContractAsync({
        address: vaultAddress,
        abi: VAULT_ABI,
        functionName: "withdraw",
        args: [assets, address, address],
      });
      return hash;
    } finally {
      setTxPending(false);
    }
  }, [address, vaultAddress, writeContractAsync]);

  const approve = useCallback(async (amount: string): Promise<`0x${string}`> => {
    if (!address) throw new Error("Wallet not connected");
    setTxPending(true);
    try {
      const hash = await writeContractAsync({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [vaultAddress, parseUnits(amount, 6)],
      });
      return hash;
    } finally {
      setTxPending(false);
    }
  }, [address, usdcAddress, vaultAddress, writeContractAsync]);

  const setStrategy = useCallback(async (allocationBps: number, riskLevel: number) => {
    if (!address) throw new Error("Wallet not connected");
    setTxPending(true);
    try {
      const hash = await writeContractAsync({
        address: registryAddress,
        abi: STRATEGY_REGISTRY_ABI,
        functionName: "setStrategy",
        args: [address, { allocationBps: BigInt(allocationBps), riskLevel, rebalanceThreshold: BigInt(100), active: true }],
      });
      return hash;
    } finally {
      setTxPending(false);
    }
  }, [address, registryAddress, writeContractAsync]);

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
