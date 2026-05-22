import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "YieldMind | AI-Native Yield Automation",
  description: "Agentic yield vaults on Arbitrum — describe your strategy, let AI execute it.",
  openGraph: {
    title: "YieldMind — AI Yield Agent on Arbitrum",
    description: "Deposit USDC, set your strategy in natural language, and let our AI agent optimize your yield 24/7.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
