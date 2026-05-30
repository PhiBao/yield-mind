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

const RISK_LABELS = ["Minimal", "Conservative", "Moderate", "Aggressive", "High Yield"];

const VAULT_ABI = [
  { type: "function", name: "totalAssets", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "totalSupply", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "balanceOf", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "rebalance", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
] as const;

const REGISTRY_ABI = [
  { type: "function", name: "getStrategy", inputs: [{ type: "address" }], outputs: [
    { type: "tuple", components: [
      { name: "allocationBps", type: "uint256" },
      { name: "riskLevel", type: "uint8" },
      { name: "rebalanceThreshold", type: "uint256" },
      { name: "active", type: "bool" },
    ]},
  ], stateMutability: "view" },
] as const;

const CHAIN_LABELS: Record<number, string> = {
  42161: "Arbitrum One", 421614: "Arbitrum Sepolia", 46630: "Robinhood Testnet",
};

interface UserEntry {
  address: string;
  shares: string;
  value: number;
  allocationPct: number;
  riskLevel: number;
  riskLabel: string;
  active: boolean;
}

function getChain(chainId: number, rpcUrl: string) {
  if (chainId === 46630) {
    return defineChain({ id: 46630, name: "Robinhood Testnet",
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      rpcUrls: { default: { http: [rpcUrl] } } });
  }
  return arbitrumSepolia;
}

async function buildLeaderboard(env: Env): Promise<UserEntry[]> {
  const chainId = Number(env.CHAIN_ID) || 421614;
  const chain = getChain(chainId, env.RPC_URL);
  const publicClient = createPublicClient({ chain, transport: http(env.RPC_URL) });
  const vaultAddress = env.VAULT_ADDRESS as Address;
  const registryAddress = env.STRATEGY_REGISTRY as Address;

  const [totalAssets, totalSupply, depositEvents] = await Promise.all([
    publicClient.readContract({ address: vaultAddress, abi: VAULT_ABI, functionName: "totalAssets" }),
    publicClient.readContract({ address: vaultAddress, abi: VAULT_ABI, functionName: "totalSupply" }),
    publicClient.getLogs({
      address: vaultAddress,
      event: {
        type: "event",
        name: "Deposit",
        inputs: [
          { type: "address", name: "sender", indexed: true },
          { type: "address", name: "owner", indexed: true },
          { type: "uint256", name: "assets" },
          { type: "uint256", name: "shares" },
        ],
      },
      fromBlock: 0n,
    }).catch(() => []),
  ]);

  const sharePrice = totalSupply > 0n ? Number(formatUnits(totalAssets, 6)) / Number(formatUnits(totalSupply, 6)) : 1;

  // Deduplicate depositors from Deposit events
  const seen = new Set<string>();
  const depositors: Address[] = [];
  for (const log of depositEvents) {
    const owner = `0x${log.topics[2].slice(26)}` as Address;
    if (!seen.has(owner.toLowerCase())) {
      seen.add(owner.toLowerCase());
      depositors.push(owner);
    }
  }

  const entries: UserEntry[] = [];
  for (const user of depositors.slice(0, 50)) {
    const [shares, strategyRaw] = await Promise.all([
      publicClient.readContract({ address: vaultAddress, abi: VAULT_ABI, functionName: "balanceOf", args: [user] }),
      publicClient.readContract({ address: registryAddress, abi: REGISTRY_ABI, functionName: "getStrategy", args: [user] }).catch(() => null),
    ]);
    if (shares === 0n) continue;
    const value = Number(formatUnits(shares, 6)) * sharePrice;
    const strat = strategyRaw as unknown as { allocationBps: bigint; riskLevel: number; active: boolean } | null;
    entries.push({
      address: user,
      shares: formatUnits(shares, 6),
      value,
      allocationPct: strat ? Number(strat.allocationBps) / 100 : 0,
      riskLevel: strat ? strat.riskLevel : 0,
      riskLabel: strat ? RISK_LABELS[strat.riskLevel] ?? "N/A" : "N/A",
      active: strat?.active ?? false,
    });
  }
  return entries.sort((a, b) => b.value - a.value);
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

    const [totalAssets, totalSupply] = await Promise.all([
      publicClient.readContract({ address: vaultAddress, abi: VAULT_ABI, functionName: "totalAssets" }),
      publicClient.readContract({ address: vaultAddress, abi: VAULT_ABI, functionName: "totalSupply" }),
    ]);
    const sharePrice = totalSupply > 0n ? Number(formatUnits(totalAssets, 6)) / Number(formatUnits(totalSupply, 6)) : 1;
    logs.push(`[${chainLabel}] TVL: $${formatUnits(totalAssets, 6)} | Price: $${sharePrice.toFixed(6)}`);

    const knownUsers = (env.WATCHED_USERS || "").split(",").map(s => s.trim()).filter(s => s.length > 0) as Address[];
    if (knownUsers.length === 0) { logs.push(`[${chainLabel}] No watched users. Idle.`); return logs; }

    for (const user of knownUsers) {
      const shares = await publicClient.readContract({ address: vaultAddress, abi: VAULT_ABI, functionName: "balanceOf", args: [user] });
      if (shares === 0n) continue;
      const userValue = Number(formatUnits(shares, 6)) * sharePrice;
      logs.push(`[${chainLabel}] ${user.slice(0,6)}...${user.slice(-4)}: $${userValue.toFixed(2)}`);
      const newAlloc = computeOptimalAllocation(shares, sharePrice);
      const txHash = await walletClient.writeContract({
        address: vaultAddress, abi: VAULT_ABI, functionName: "rebalance",
        args: [user, BigInt(newAlloc)], account,
      });
      logs.push(`[${chainLabel}] Rebalanced → ${newAlloc}bps tx ${txHash.slice(0,10)}...`);
    }
    logs.push(`[${chainLabel}] Cycle complete.`);
  } catch (err) {
    logs.push(`[ERROR] ${err instanceof Error ? err.message : String(err)}`);
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

interface AdvisorResult {
  allocationBps: number;
  riskLevel: number;
  reasoning: string;
}

async function advisorParse(env: Env, userInput: string, portfolioValue?: number): Promise<AdvisorResult> {
  const input = userInput.toLowerCase();

  function local(): AdvisorResult {
    if (input.includes("safe") || input.includes("stable") || input.includes("conservative"))
      return { allocationBps: 2000, riskLevel: 0, reasoning: "Conservative strategy prioritizes capital preservation with minimal growth exposure." };
    if (input.includes("balanced") || input.includes("moderate"))
      return { allocationBps: 5000, riskLevel: 2, reasoning: "Balanced 50/50 split between stable yield and growth assets for moderate returns." };
    if (input.includes("degen") || input.includes("max") || input.includes("extreme"))
      return { allocationBps: 9500, riskLevel: 4, reasoning: "Maximum growth exposure. High risk, high potential return. Not for the faint of heart." };
    if (input.includes("aggressive") || input.includes("high") || input.includes("yield") || input.includes("growth"))
      return { allocationBps: 8000, riskLevel: 4, reasoning: "Growth-oriented with heavy allocation to yield-generating assets." };
    return { allocationBps: 5000, riskLevel: 2, reasoning: "Default balanced strategy. Adjust sliders for customization." };
  }

  if (!env.DGRID_API_KEY) {
    const result = local();
    if (portfolioValue) result.reasoning += ` Portfolio: $${portfolioValue.toFixed(2)}.`;
    return result;
  }

  try {
    const response = await fetch("https://api.dgrid.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.DGRID_API_KEY}` },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [{
          role: "system",
          content: `You are a DeFi strategy advisor. Given a user's strategy description${portfolioValue ? ` and portfolio value $${portfolioValue.toFixed(2)}` : ""}, extract allocation (0-10000 bps) and risk level (0-4). Also provide a short reasoning sentence (max 100 chars).
Respond with JSON only: { "allocationBps": number, "riskLevel": number, "reasoning": "string" }`,
        }, { role: "user", content: userInput }],
      }),
    });
    const data = await response.json() as any;
    return JSON.parse(data.choices[0].message.content);
  } catch {
    return local();
  }
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    for (const log of await checkAndRebalance(env)) console.log(log);
  },

  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    const url = new URL(request.url);
    const json = (data: unknown, status = 200) => Response.json(data, { status, headers: corsHeaders });

    if (request.method === "GET" && url.pathname === "/api/leaderboard") {
      try {
        const entries = await buildLeaderboard(env);
        const chainId = Number(env.CHAIN_ID) || 421614;
        return json({ chain: CHAIN_LABELS[chainId] ?? `Chain ${chainId}`, entries, updatedAt: Date.now() });
      } catch (err) {
        return json({ error: "Failed to build leaderboard" }, 500);
      }
    }

    if (request.method === "POST" && url.pathname === "/api/parse-strategy") {
      const body = (await request.json()) as { text: string; portfolioValue?: number };
      const result = await advisorParse(env, body.text, body.portfolioValue);
      return json(result);
    }

    if (request.method === "GET" && url.pathname === "/api/status") {
      const chainId = Number(env.CHAIN_ID) || 421614;
      return json({
        status: "ok", chain: CHAIN_LABELS[chainId] ?? `Chain ${chainId}`,
        vault: env.VAULT_ADDRESS, chainId, timestamp: Date.now(),
      });
    }

    if (request.method === "POST" && url.pathname === "/api/trigger") {
      _ctx.waitUntil(checkAndRebalance(env).then((logs) => { for (const log of logs) console.log(log); }));
      return json({ triggered: true });
    }

    return new Response("YieldMind Agent", { status: 200, headers: corsHeaders });
  },
};
