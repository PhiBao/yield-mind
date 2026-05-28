import { createPublicClient, createWalletClient, http, parseUnits, formatUnits, defineChain, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";

interface Env {
  VAULT_ADDRESS: string;
  STRATEGY_REGISTRY: string;
  STYLUS_AGENT: string;
  RPC_URL: string;
  CHAIN_ID: string;
  AGENT_PRIVATE_KEY: string;
  DGRID_API_KEY: string;
  WATCHED_USERS: string;
}

interface Strategy {
  allocationBps: bigint;
  riskLevel: number;
  rebalanceThreshold: bigint;
  active: boolean;
}

const VAULT_ABI = [
  { type: "function", name: "totalAssets", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "totalSupply", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "balanceOf", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "rebalance", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
] as const;

const CHAIN_LABELS: Record<number, string> = {
  42161: "Arbitrum One",
  421614: "Arbitrum Sepolia",
  46630: "Robinhood Testnet",
};

function getChain(chainId: number, rpcUrl: string) {
  if (chainId === 46630) {
    return defineChain({
      id: 46630,
      name: "Robinhood Testnet",
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      rpcUrls: { default: { http: [rpcUrl] } },
    });
  }
  return arbitrumSepolia;
}

async function checkAndRebalance(env: Env): Promise<string[]> {
  const logs: string[] = [];
  const chainId = Number(env.CHAIN_ID) || 421614;
  const chainLabel = CHAIN_LABELS[chainId] ?? `Chain ${chainId}`;

  try {
    const chain = getChain(chainId, env.RPC_URL);
    const publicClient = createPublicClient({ chain, transport: http(env.RPC_URL) });

    const account = privateKeyToAccount(env.AGENT_PRIVATE_KEY as `0x${string}`);
    const walletClient = createWalletClient({ account, chain, transport: http(env.RPC_URL) });

    const vaultAddress = env.VAULT_ADDRESS as Address;

    const totalAssets = await publicClient.readContract({
      address: vaultAddress, abi: VAULT_ABI, functionName: "totalAssets",
    });
    const totalSupply = await publicClient.readContract({
      address: vaultAddress, abi: VAULT_ABI, functionName: "totalSupply",
    });

    const sharePrice = totalSupply > 0n
      ? Number(formatUnits(totalAssets, 6)) / Number(formatUnits(totalSupply, 6))
      : 1;

    logs.push(`[${chainLabel}] TVL: $${formatUnits(totalAssets, 6)} | Share price: $${sharePrice.toFixed(6)}`);

    const knownUsers = (env.WATCHED_USERS || "")
      .split(",").map((s) => s.trim()).filter((s) => s.length > 0) as Address[];

    if (knownUsers.length === 0) {
      logs.push(`[${chainLabel}] WATCHED_USERS not set. Idle.`);
      return logs;
    }

    for (const user of knownUsers) {
      const shares = await publicClient.readContract({
        address: vaultAddress, abi: VAULT_ABI, functionName: "balanceOf", args: [user],
      });
      if (shares === 0n) continue;

      const userValue = Number(formatUnits(shares, 6)) * sharePrice;
      logs.push(`[${chainLabel}] User ${user.slice(0, 6)}...${user.slice(-4)}: $${userValue.toFixed(2)}`);

      const newAllocation = computeOptimalAllocation(shares, sharePrice);
      logs.push(`[${chainLabel}] Rebalancing to ${newAllocation}% growth`);

      const txHash = await walletClient.writeContract({
        address: vaultAddress, abi: VAULT_ABI, functionName: "rebalance",
        args: [user, BigInt(newAllocation)], account,
      });
      logs.push(`[${chainLabel}] Tx: ${txHash} → ${newAllocation} bps`);
    }

    logs.push(`[${chainLabel}] Cycle complete.`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logs.push(`[${chainLabel} ERROR] ${message}`);
  }

  return logs;
}

function computeOptimalAllocation(shares: bigint, sharePrice: number): number {
  const value = Number(formatUnits(shares, 6)) * sharePrice;
  if (value < 100) return 3000;
  if (value < 1000) return 5000;
  if (value < 10000) return 6500;
  return 7500;
}

async function parseStrategyWithAI(env: Env, userInput: string): Promise<{ allocationBps: number; riskLevel: number }> {
  if (!env.DGRID_API_KEY) {
    const input = userInput.toLowerCase();
    if (input.includes("safe") || input.includes("stable")) return { allocationBps: 2000, riskLevel: 0 };
    if (input.includes("balanced")) return { allocationBps: 5000, riskLevel: 2 };
    if (input.includes("aggressive") || input.includes("growth") || input.includes("yield")) return { allocationBps: 8000, riskLevel: 4 };
    return { allocationBps: 5000, riskLevel: 2 };
  }

  const response = await fetch("https://api.dgrid.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.DGRID_API_KEY}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a DeFi strategy parser. Extract allocation (0-10000 bps) and risk level (0-4) from user strategy descriptions.
Respond with JSON only: { "allocationBps": number, "riskLevel": number }`,
        },
        { role: "user", content: userInput },
      ],
    }),
  });

  const data = await response.json() as any;
  return JSON.parse(data.choices[0].message.content);
}

async function runChain(env: Env, chainLabel: string): Promise<string[]> {
  const logs = await checkAndRebalance(env);
  return logs.map((l) => `[${chainLabel}] ${l}`);
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    const logs = await checkAndRebalance(env);
    for (const log of logs) console.log(log);
  },

  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/api/parse-strategy") {
      const body = (await request.json()) as { text: string };
      const result = await parseStrategyWithAI(env, body.text);
      return Response.json(result);
    }

    if (request.method === "GET" && url.pathname === "/api/status") {
      const chainId = Number(env.CHAIN_ID) || 421614;
      return Response.json({
        status: "ok",
        chain: CHAIN_LABELS[chainId] ?? `Chain ${chainId}`,
        vault: env.VAULT_ADDRESS,
        chainId,
        timestamp: Date.now(),
      });
    }

    if (request.method === "POST" && url.pathname === "/api/trigger") {
      _ctx.waitUntil(checkAndRebalance(env).then((logs) => {
        for (const log of logs) console.log(log);
      }));
      return Response.json({ triggered: true, message: "Agent cycle initiated" });
    }

    return new Response("YieldMind Agent — use cron trigger or POST /api/trigger", { status: 200 });
  },
};
