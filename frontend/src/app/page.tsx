"use client";

import { Navbar } from "@/components/Navbar";
import { Dashboard } from "@/components/Dashboard";
import { TerminalHeader } from "@/components/TerminalHeader";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="mb-8">
          <TerminalHeader
            title="yieldmind@arbitrum:~$ ./dashboard"
            subtitle="AI-Native Yield Automation Engine | Deployed on Arbitrum"
          />
        </div>
        <Dashboard />
      </main>
      <footer className="border-t border-terminal-border py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-[10px] font-mono text-terminal-muted">
          <span>YieldMind v0.1 — Built for Arbitrum Open House London</span>
          <span className="hidden sm:block">
            <span className="text-terminal-green">●</span> Agent: online
            <span className="mx-2">|</span>
            Network: Arbitrum Sepolia
            <span className="mx-2">|</span>
            <span className="text-terminal-cyan">Stylus</span> + <span className="text-terminal-magenta">Solidity</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
