const ARB_MAINNET = 42161;
const ARB_SEPOLIA = 421614;
const RHC_TESTNET = 46630;

export const SUPPORTED_CHAINS = [ARB_SEPOLIA, RHC_TESTNET, ARB_MAINNET] as const;

export const VAULT_ADDRESSES: Record<number, `0x${string}`> = {
  [ARB_SEPOLIA]: "0x92d7CeF16D139CB1A3a730f34361C3d56aC0d549",
  [RHC_TESTNET]: "0xEF673BDac2C86506874919b1ad05Bd7D7fa64344",
};

export const STRATEGY_REGISTRY_ADDRESSES: Record<number, `0x${string}`> = {
  [ARB_SEPOLIA]: "0x0211FD438051De69ba9942F0aafE950b18875073",
  [RHC_TESTNET]: "0xD4f72d31D66cA11Cdfd428cDc08B438D2681362B",
};

export const USDC_ADDRESSES: Record<number, `0x${string}`> = {
  [ARB_MAINNET]: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  [ARB_SEPOLIA]: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
  [RHC_TESTNET]: "0x6792E51FBD24f9315282BD5b6c5E713dCc779C69",
};

export function getVaultAddress(chainId: number): `0x${string}` {
  return VAULT_ADDRESSES[chainId] ?? "0x";
}

export function getStrategyRegistryAddress(chainId: number): `0x${string}` {
  return STRATEGY_REGISTRY_ADDRESSES[chainId] ?? "0x";
}

export function getUsdcAddress(chainId: number): `0x${string}` {
  return USDC_ADDRESSES[chainId] ?? "0x";
}

export const VAULT_ABI = [
  {
    type: "function",
    name: "totalAssets",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalSupply",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getUserPosition",
    inputs: [{ name: "user", type: "address", internalType: "address" }],
    outputs: [
      { name: "shares", type: "uint256", internalType: "uint256" },
      { name: "assets", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ name: "", type: "uint8", internalType: "uint8" }],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "deposit",
    inputs: [
      { name: "assets", type: "uint256", internalType: "uint256" },
      { name: "receiver", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "shares", type: "uint256", internalType: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdraw",
    inputs: [
      { name: "assets", type: "uint256", internalType: "uint256" },
      { name: "receiver", type: "address", internalType: "address" },
      { name: "owner", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "shares", type: "uint256", internalType: "uint256" }],
    stateMutability: "nonpayable",
  },
] as const;

export const STRATEGY_REGISTRY_ABI = [
  {
    type: "function",
    name: "getStrategy",
    inputs: [{ name: "user", type: "address", internalType: "address" }],
    outputs: [
      {
        type: "tuple",
        internalType: "struct Strategy",
        components: [
          { name: "allocationBps", type: "uint256", internalType: "uint256" },
          { name: "riskLevel", type: "uint8", internalType: "uint8" },
          { name: "rebalanceThreshold", type: "uint256", internalType: "uint256" },
          { name: "active", type: "bool", internalType: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "setStrategy",
    inputs: [
      { name: "user", type: "address", internalType: "address" },
      {
        name: "strategy",
        type: "tuple",
        internalType: "struct Strategy",
        components: [
          { name: "allocationBps", type: "uint256", internalType: "uint256" },
          { name: "riskLevel", type: "uint8", internalType: "uint8" },
          { name: "rebalanceThreshold", type: "uint256", internalType: "uint256" },
          { name: "active", type: "bool", internalType: "bool" },
        ],
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

export const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address", internalType: "address" },
      { name: "spender", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "nonpayable",
  },
] as const;
