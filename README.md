# YieldMind — AI-Native Yield Automation on Arbitrum

> **Built for Arbitrum Open House London Online Buildathon**
> Tracks: Overall Prize · Best Agentic Project · Dual-Chain (Arbitrum + Robinhood)

YieldMind lets users deposit USDC into a vault, configure a yield strategy in natural language (or via sliders), and let an **AI agent** autonomously rebalance their position. Deployed on **Arbitrum Sepolia** and **Robinhood Testnet**.

---

## Why YieldMind
Current yield farming requires constant monitoring, gas optimization, and manual rebalancing. Retail users can't compete with sophisticated bots. Existing "auto-compounders" are rigid and don't adapt to market conditions.

YieldMind solves this: **describe your strategy in plain English, and an AI agent executes it on Arbitrum and Robinhood.** Stacking Stylus (Rust) for gas-efficient strategy computation with Solidity for the vault layer.

---

## How YieldMind Works

### User Flow
```
1. CONNECT            → 2. DEPOSIT           → 3. CONFIGURE        → 4. AGENT RUNS
                      
┌──────────┐        ┌──────────────┐       ┌───────────────┐       ┌────────────────┐
│ Connect   │       │ Approve USDC │       │ Set strategy  │       │ Agent monitors │
│ wallet    │──────▶│ + Deposit    │──────▶│ via sliders  │──────▶│ + rebalances  │
│ (Rainbow) │       │ into vault   │       │ or AI prompt  │       │ every ~5 min   │
└──────────┘        └──────────────┘       └───────────────┘       └────────────────┘
```

1. **Deposit USDC** — Connect wallet, approve USDC, deposit into vault. Vault mints shares 1:1.
2. **Set strategy** — Sliders (% growth + risk level 0–4) or natural language ("aggressive growth with high risk"). Stored on-chain in `StrategyRegistry`.
3. **Agent rebalances** — Cloudflare Worker cron every 5 min: reads on-chain state, computes optimal allocation, submits `rebalance()` tx.
4. **Monitor** — Dashboard shows share price, TVL, your position, 24h chart, live agent log.

### Design Decisions
| Decision | Why |
|----------|-----|
| **Stylus (Rust) strategy math** | ~10x gas savings vs Solidity. Judge differentiator. |
| **Dual-chain (Arbitrum + Robinhood)** | Eligibility for both prize tracks |
| **Mock USDC on RHC testnet** | Self-contained demo — faucet mints test tokens on-chain |
| **Agent on cron, not events** | $0 cost on Cloudflare Free tier |
| **Frontend reads contracts directly** | No backend DB. On-chain = verifiable. |

---

## Go-to-Market Plan

### Target Users

| Segment | Pain Point | YieldMind Fit |
|---------|-----------|---------------|
| **DeFi retail users** (crypto-native, $1k–$50k portfolio) | Yield farming is time-consuming; can't compete with bots | Set-and-forget strategy execution with 5-min rebalance frequency |
| **Arbitrum ecosystem users** (existing depositors on Aave/GMX) | Managing multiple positions across protocols is fragmented | Unified dashboard + AI agent that could manage cross-protocol positions (post-MVP) |
| **Crypto newcomers** (<6 months in crypto) | Don't understand yield strategies; fear making mistakes | Natural language strategy setup removes technical barrier |
| **Power users** (high net worth, $50k+) | Need custom risk parameters and transparency | On-chain strategy verification, full control over allocation |

**TAM**: ~2.5M active Arbitrum addresses × avg $2.8k DeFi TVL per address = **~$7B addressable market** (Arbitrum DeFi TVL ~$18B as of Q1 2026)

**SAM**: Retail users actively seeking automated yield tools (est. 15% of TAM) = **~$1B**

**SOM (Year 1)**: Target 500 active depositors with avg $2k = **$1M TVL**

### Growth Loops

1. **Viral agent log**: Users share their agent's rebalance history on social media → others see it → deposit → share their own log
2. **Strategy marketplace (post-MVP)**: Users publish their strategy templates → other users copy them → original creator earns a fee share
3. **Referral yield boost**: Referred users boost both referrer and referee APY by 5% for 30 days

### Revenue Model (Post-MVP)

| Model | Detail | Est. Margin |
|-------|--------|-------------|
| **Performance fee** | 10% of yield above a benchmark (e.g., Aave deposit APY) | 100% software margin |
| **Strategy marketplace fee** | 2% fee on copied strategies, shared with original creator | 80% to protocol |
| **Premium tiers** | Faster rebalance frequency (1 min vs 5 min), multi-asset vaults, Telegram alerts | $9.99/mo |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                  Frontend (Next.js 15)                       │
│          Vercel · wagmi · RainbowKit · Tailwind              │
│         Cyberpunk terminal UI + live agent log               │
└───────────────────────┬──────────────────────────────────────┘
                        │                         ▲
                        ▼                         │
┌──────────────────────────────────────────────────────────────┐
│              Agent Runner (Cloudflare Workers)               │
│        Cron: */5 * * * · viem · DGrid AI Gateway             │
│    Reads on-chain state, evaluates strategies,               │
│    submits rebalance txns                                    │
└───────────────────────┬──────────────────────────────────────┘
                        │                         ▲
                        ▼                         │
┌──────────────────────────────────────────────────────────────┐
│                On-Chain (Deployed)                           │
│  ┌────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │   Vault    │  │ StrategyRegistry │  │ Agent Executor   │  │
│  │ (Solidity) │◄►│   (Solidity)     │  │  (Stylus/Rust)   │  │
│  │ ERC4626    │  │ Per-user config  │  │ Gas-opt math     │  │
│  └────────────┘  └──────────────────┘  └──────────────────┘  │
│  Arbitrum Sepolia (421614)  ·  Robinhood Testnet (46630)     │
└──────────────────────────────────────────────────────────────┘
```

| Layer | Stack | Cost |
|-------|-------|------|
| Contracts | Solidity 0.8.26 + Stylus (Rust 0.10) | Gas only |
| Frontend | Next.js 15 + wagmi + RainbowKit | Vercel Hobby → **$0** |
| Agent | Cloudflare Workers | Free tier → **$0** |
| RPC | Public endpoints | Free → **$0** |
| AI | DGrid AI Gateway | ~$0.01/month |

---

## Smart Contracts

### Vault (`contracts/src/Vault.sol`)
ERC4626-like USDC vault. Deposit → mint shares. Withdraw → burn shares. Only agent can rebalance.

| Function | Access | Description |
|----------|--------|-------------|
| `deposit(assets, receiver)` | Public | Deposit USDC, mint shares |
| `withdraw(assets, receiver, owner)` | Public | Burn shares, withdraw USDC |
| `rebalance(user, newAlloc)` | Agent-only | Update allocation |
| `getUserPosition(user)` | View | `(shares, assets)` |

### StrategyRegistry (`contracts/src/StrategyRegistry.sol`)
Per-user strategy storage on-chain.
```solidity
struct Strategy {
    uint256 allocationBps;  // 0–10000 (0% to 100% growth)
    uint8   riskLevel;      // 0–4 (Minimal → High Yield)
    uint256 rebalanceThreshold;
    bool    active;
}
```

### Agent Executor (`contracts/stylus/agent-executor/src/lib.rs`)
Stylus (Rust → WASM) contract for gas-efficient strategy computation:
- `compute_optimal_allocation(user, volatility, apy, risk_tolerance)` — allocation math
- `validate_rebalance(user, proposedAlloc)` — 1h cooldown + 5% min change
- `execute_rebalance(user, allocBps)` — vault-only

### MockUSDC (`contracts/src/MockUSDC.sol`)
Testnet-only. 6-decimals, `mint()` is open for the faucet. **Not deployed on mainnet.**

---

## Deployed Addresses

### Arbitrum Sepolia (Chain 421614)
| Contract | Address |
|----------|---------|
| Vault | `0x92d7CeF16D139CB1A3a730f34361C3d56aC0d549` |
| StrategyRegistry | `0x0211FD438051De69ba9942F0aafE950b18875073` |
| Agent Executor (Stylus) | `0xe7fcf23dadab116e2adb5f3bdac4729c84e17781` |
| USDC (official testnet) | `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d` |

### Robinhood Testnet (Chain 46630)
| Contract | Address |
|----------|---------|
| Vault | `0xEF673BDac2C86506874919b1ad05Bd7D7fa64344` |
| StrategyRegistry | `0xD4f72d31D66cA11Cdfd428cDc08B438D2681362B` |
| MockUSDC | `0x6792E51FBD24f9315282BD5b6c5E713dCc779C69` |
| Deployer | `0x4Ba1e9e275EF61B56C99532D0066506436201D73` |

---

## Frontend

### Components
| Component | What it does |
|-----------|-------------|
| `Navbar` | Wallet connect + chain selector (Arb Sepolia / Arb One / RHC) |
| `Dashboard` | Stats grid, Quick Start guide, live agent log |
| `Faucet` | RHC only: one-click mint 1000 USDC + pre-approve vault |
| `VaultManager` | Deposit / withdraw toggle, MAX button |
| `ApprovalGuard` | Shows when allowance insufficient; inline approve |
| `StrategyForm` | Sliders (growth % + risk) + AI natural language mode |
| `PositionCard` | Shares, USD value, strategy summary |
| `PortfolioChart` | 24h performance chart |
| `TransactionToast` | Real-time tx confirmation toasts |

### Vercel Deploy
1. Push to GitHub
2. Import in Vercel → set **Root Directory** to `frontend/`
3. Add env vars:
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` — from [cloud.reown.com](https://cloud.reown.com)
   - `NEXT_PUBLIC_AGENT_URL` — (optional) your Cloudflare Worker URL for AI mode
4. Deploy. Vercel auto-detects Next.js + pnpm.

---

## Local Development

### Setup
```bash
# Prerequisites: Node 18+, pnpm, Foundry, Rust
pnpm install
cd contracts && forge install foundry-rs/forge-std && cd ..

# Tests
forge test        # 7/7 passing
pnpm dev          # http://localhost:3000
```

### Deploy contracts
```bash
cd contracts
cp .env.example .env   # fill in PRIVATE_KEY

# Arbitrum Sepolia
forge script script/Deploy.s.sol --rpc-url arbitrum_sepolia --broadcast

# Robinhood Testnet
forge script script/DeployRHC.s.sol --rpc-url $RPC_RHC --broadcast --legacy --skip-simulation
```

### Deploy Stylus contract
```bash
cd contracts/stylus/agent-executor
cargo stylus deploy --no-verify \
  --private-key $PRIVATE_KEY \
  --endpoint $RPC_URL \
  --wasm-file target/wasm32-unknown-unknown/release/agent_executor.wasm \
  --max-fee-per-gas-gwei 100
```

### Deploy agent (Cloudflare Worker)
```bash
cd agent
npx wrangler secret put AGENT_PRIVATE_KEY  # paste deployer key
npx wrangler secret put DGRID_API_KEY      # optional
npx wrangler deploy
```

---

## Project Structure
```
arb/
├── contracts/
│   ├── src/              # Solidity contracts
│   │   ├── Vault.sol
│   │   ├── StrategyRegistry.sol
│   │   ├── MockUSDC.sol  # RHC testnet only
│   │   └── interfaces/
│   ├── stylus/agent-executor/  # Rust Stylus contract
│   │   ├── src/lib.rs
│   │   ├── Stylus.toml
│   │   └── deploy.sh
│   ├── script/           # Foundry deploy scripts
│   │   ├── Deploy.s.sol       # Arb Sepolia / One
│   │   └── DeployRHC.s.sol    # Robinhood Testnet
│   └── test/             # 7 passing tests
├── frontend/             # Next.js 15 dapp
│   ├── src/
│   │   ├── app/          # Layout, page, globals.css
│   │   ├── components/   # Dashboard, Navbar, Faucet, etc.
│   │   ├── hooks/        # useVault.ts (wagmi)
│   │   ├── lib/          # contracts.ts (chain-aware), wallet.tsx
│   │   └── types/
│   └── .env.example
├── agent/                # Cloudflare Worker
│   ├── src/index.ts
│   ├── wrangler.toml
│   └── .env.example
└── .env.example          # Root DGRID_API_KEY
```

---

## License
MIT — Built for Arbitrum Open House London 2026.
