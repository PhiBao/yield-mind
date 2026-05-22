"use client";

import { createConfig, http, createStorage } from "wagmi";
import { arbitrum, arbitrumSepolia } from "wagmi/chains";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
  coinbaseWallet,
} from "@rainbow-me/rainbowkit/wallets";

const projectId = "YOUR_WALLETCONNECT_PROJECT_ID";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [rainbowWallet, metaMaskWallet, coinbaseWallet, walletConnectWallet],
    },
  ],
  { appName: "YieldMind", projectId }
);

export const config = createConfig({
  chains: [arbitrumSepolia, arbitrum],
  transports: {
    [arbitrumSepolia.id]: http("https://sepolia-rollup.arbitrum.io/rpc"),
    [arbitrum.id]: http("https://arb1.arbitrum.io/rpc"),
  },
  connectors,
  storage: createStorage({ storage: typeof window !== "undefined" ? window.localStorage : undefined }),
  ssr: true,
});
