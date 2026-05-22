export const VAULT_ADDRESS = "0x92d7CeF16D139CB1A3a730f34361C3d56aC0d549";
export const STRATEGY_REGISTRY_ADDRESS = "0x0211FD438051De69ba9942F0aafE950b18875073";

export const USDC_ADDRESSES: Record<number, `0x${string}`> = {
  42161: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  421614: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
};

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
