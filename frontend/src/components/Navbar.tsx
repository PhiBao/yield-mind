"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { Cpu, AlertTriangle } from "lucide-react";

const ARBITRUM_SEPOLIA_ID = 421614;
const ARBITRUM_ONE_ID = 42161;
const RHC_TESTNET_ID = 46630;

function chainLabel(chainId: number): string {
  switch (chainId) {
    case ARBITRUM_ONE_ID: return "Arbitrum One";
    case ARBITRUM_SEPOLIA_ID: return "Arbitrum Sepolia";
    case RHC_TESTNET_ID: return "Robinhood Testnet";
    default: return "Unknown";
  }
}

export function Navbar() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const isCorrectChain = chainId === ARBITRUM_SEPOLIA_ID || chainId === ARBITRUM_ONE_ID || chainId === RHC_TESTNET_ID;

  return (
    <nav className="sticky top-0 z-50 border-b border-terminal-border bg-terminal-black/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Cpu className="w-6 h-6 text-terminal-green glow-text" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-terminal-green rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold font-mono glow-text">YieldMind</h1>
              <p className="text-[10px] text-terminal-muted font-mono -mt-1">
                AI yield agent <span className="text-terminal-cyan">v0.1</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isConnected && !isCorrectChain && (
              <button
                onClick={() => switchChain?.({ chainId: ARBITRUM_SEPOLIA_ID })}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-terminal-red/10 border border-terminal-red/30 text-terminal-red text-xs font-mono hover:bg-terminal-red/20 transition-all"
              >
                <AlertTriangle className="w-3 h-3" />
                Wrong network
              </button>
            )}
            {isConnected && isCorrectChain && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-terminal-gray/50 border border-terminal-border text-xs font-mono">
                <div className="w-1.5 h-1.5 rounded-full bg-terminal-green animate-pulse" />
                <span className="text-terminal-muted">{chainLabel(chainId)}</span>
              </div>
            )}
            <ConnectButton
              accountStatus={{ smallScreen: "avatar", largeScreen: "full" }}
              chainStatus={{ smallScreen: "icon", largeScreen: "full" }}
              showBalance={{ smallScreen: false, largeScreen: true }}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
