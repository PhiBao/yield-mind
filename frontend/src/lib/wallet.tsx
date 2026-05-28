"use client";

import { createConfig, http, createStorage } from "wagmi";
import { arbitrum, arbitrumSepolia } from "wagmi/chains";
import { defineChain } from "viem";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
  coinbaseWallet,
} from "@rainbow-me/rainbowkit/wallets";

export const robinhoodTestnet = defineChain({
  id: 46630,
  name: "Robinhood Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.chain.robinhood.com"] } },
  blockExplorers: {
    default: { name: "RHC Explorer", url: "https://testnet.explorer.chain.robinhood.com" },
  },
  testnet: true,
});

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "00000000000000000000000000000000";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [rainbowWallet, metaMaskWallet, coinbaseWallet, walletConnectWallet],
    },
  ],
  { appName: "YieldMind", projectId }
);

export const SUPPORTED_CHAINS = [arbitrumSepolia, robinhoodTestnet, arbitrum] as const;

export const config = createConfig({
  chains: [arbitrumSepolia, robinhoodTestnet, arbitrum],
  transports: {
    [arbitrumSepolia.id]: http("https://sepolia-rollup.arbitrum.io/rpc"),
    [robinhoodTestnet.id]: http("https://rpc.testnet.chain.robinhood.com"),
    [arbitrum.id]: http("https://arb1.arbitrum.io/rpc"),
  },
  connectors,
  storage: createStorage({ storage: typeof window !== "undefined" ? window.localStorage : undefined }),
  ssr: true,
});
