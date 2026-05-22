# YieldMind — AI-Native Yield Automation on Arbitrum

> **Built for Arbitrum Open House London Online Buildathon**
> Tracks: Overall Prize · Best Agentic Project

YieldMind lets users deposit USDC into a vault, configure a yield strategy in natural language (or via sliders), and let an **AI agent** autonomously rebalance their position on Arbitrum.

---

## Why YieldMind
Current yield farming requires constant monitoring, gas optimization, and manual rebalancing. Retail users can't compete with sophisticated bots. Existing "auto-compounders" are rigid and don't adapt to market conditions.

YieldMind solves this: **describe your strategy in plain English, and an AI agent executes it on Arbitrum.** Stacking Stylus (Rust) for gas-efficient strategy computation with Solidity for the vault layer.

---

## How YieldMind Works

### User Flow (Simplified)

```
1. CONNECT       → 2. DEPLOY          → 3. CONFIGURE        → 4. AGENT RUNS
                      
┌──────────┐        ┌──────────────┐       ┌───────────────┐       ┌────────────────┐
│ Connect   │       │ Approve USDC │       │ Set strategy  │       │ Agent monitors │
│ wallet    │──────▶│ + Deposit    │──────▶│ via sliders  │──────▶│ + rebalances  │
│ (Rainbow) │       │ into vault   │       │ or AI prompt  │       │ every ~5 min   │
└──────────┘        └──────────────┘       └───────────────┘       └────────────────┘
```

### Step-by-Step

**Step 1 — User deposits USDC**
The user connects their wallet (any EVM wallet via RainbowKit) and deposits USDC into the YieldMind vault. The vault mints shares 1:1 against the deposited amount, creating a transparent stake in the pool.

**Step 2 — User defines a strategy**
The user describes their desired strategy in one of two ways:
- **Sliders**: Adjust a stable/growth allocation split (0–100%) and a risk level (Minimal through High Yield). The sliders map directly to on-chain parameters.
- **AI Prompt**: Type natural language like *"I want balanced growth with moderate risk, 60% stable yields and 40% growth assets"*. The agent parses this via DGrid AI Gateway and auto-configures the strategy.

The strategy is stored on-chain in the `StrategyRegistry` contract — immutable, transparent, and readable by anyone.

**Step 3 — Agent evaluates and rebalances**
A Cloudflare Worker runs every 5 minutes (cron: `*/5 * * * *`). Each cycle:

1. Reads vault state: `totalAssets`, `totalSupply`, all user balances
2. For each user, reads their strategy from `StrategyRegistry`
3. Computes the optimal allocation using the Stylus (Rust) contract's gas-efficient math
4. If the current allocation deviates beyond the configured threshold, submits a `rebalance()` transaction
5. The vault updates the user's allocation on-chain

The agent is the only address authorized to call `rebalance()`, enforced by the `onlyAgent` modifier on the vault contract.

**Step 4 — User monitors**
The frontend dashboard shows:
- Current vault balance and share price
- A 24-hour performance chart (reactive to live on-chain data)
- The user's position (shares held, USD value, strategy summary)
- A live agent log terminal showing every rebalance action in real time

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Vault is simplified (no external yield sources in MVP)** | Ships fast, demonstrates full flow. Real DeFi integration (Aave/GMX) is a post-MVP milestone visible in the architecture |
| **Agent runs on cron, not events** | Keeps $0 running cost on Cloudflare Free tier. Event-driven architecture can be added later |
| **Stylus (Rust) for strategy math** | ~10x cheaper than Solidity for compute-heavy operations. Shows deeper Arbitrum tech stack competence |
| **Frontend reads directly from contracts** | No backend database needed. Everything is on-chain and verifiable |

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
┌──────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│              Vercel · wagmi · RainbowKit                 │
│           Cyberpunk terminal UI + live agent log         │
└─────────────────────┬────────────────────────────────────┘
                      │                         ▲
                      ▼                         │
┌──────────────────────────────────────────────────────────┐
│              Agent Runner (Cloudflare Workers)           │
│          Cron: */5 * * * *  ·  viem ·  OpenAI API        │
│     Reads on-chain state, evaluates strategies,          │
│     submits rebalance transactions                       │
└─────────────────────┬────────────────────────────────────┘
                      │                         ▲
                      ▼                         │
┌──────────────────────────────────────────────────────────┐
│             Arbitrum Sepolia (Deployed)                  │
│                                                          │
│  ┌──────────────┐    ┌───────────────────────┐           │
│  │    Vault     │◄──►│  StrategyRegistry     │           │
│  │  (Solidity)  │    │   (Solidity)          │           │
│  │  ERC4626     │    │  Per-user strategy    │           │
│  │  Deposit/    │    │  CRUD + rebalance     │           │
│  │  Withdraw    │    │  tracking             │           │
│  └──────┬───────┘    └───────────────────────┘           │
│         │                                                │
│         ▼                                                │
│  ┌──────────────┐                                        │
│  │  Agent Exec. │  (Stylus - Rust)                       │
│  │  Allocation  │  Gas-efficient strategy math           │
│  │  Optimizer   │  Rebalance validation                  │
│  └──────────────┘                                        │
└──────────────────────────────────────────────────────────┘
```

### Components

| Layer | Stack | Hosting |
|-------|-------|---------|
| Smart contracts | Solidity 0.8.26 + Stylus (Rust) | Arbitrum Sepolia / One |
| Frontend | Next.js 15 + wagmi + RainbowKit + Tailwind | Vercel (Hobby) → **$0** |
| Agent runner | Cloudflare Workers cron (`*/5 * * * *`) | Cloudflare (Free) → **$0** |
| RPC | Arbitrum public RPC / Alchemy | Free tier → **$0** |
| AI parsing | DGrid AI Gateway (200+ models, optional) | ~$0.01/month |

---

## Smart Contracts

### Vault (`contracts/src/Vault.sol`)
ERC4626-like vault accepting USDC deposits. Mints shares 1:1 on first deposit. Tracks total assets and per-user positions. Only the `agent` address can trigger rebalances.

**Key functions:**
| Function | Description |
|----------|-------------|
| `deposit(assets, receiver)` | Deposit USDC, mint shares |
| `withdraw(assets, receiver, owner)` | Burn shares, withdraw USDC |
| `rebalance(user, newAllocationBps)` | Agent-only: update user allocation |
| `getUserPosition(user)` | View: returns `(shares, assets)` |
| `convertToAssets(shares)` | View: share → asset conversion |

**Access control:**
- `onlyAgent` modifier on `rebalance()` — only the designated agent address can rebalance
- Owner-spender allowance on shares (via `shareAllowance` mapping) — not used in MVP, reserved for future delegated management

**Security:**
- ERC20 `transfer`/`transferFrom` return values checked (`TransferFailed` revert)
- Checked arithmetic (Solc 0.8.26 default)
- Zero-address validation on constructor
- Input validation on all public functions

### StrategyRegistry (`contracts/src/StrategyRegistry.sol`)
Stores per-user strategy parameters. Users or the contract owner can set strategies. The vault (via `onlyVault`) can update allocation during rebalances.

**Strategy struct:**
```solidity
struct Strategy {
    uint256 allocationBps;  // 0-10000 (0% to 100% growth)
    uint8   riskLevel;      // 0-4 (Minimal to High Yield)
    uint256 rebalanceThreshold; // minimum change to trigger rebalance
    bool    active;         // strategy active flag
}
```

### Agent Executor (`contracts/stylus/agent-executor/src/lib.rs`)
A Stylus smart contract written in Rust that:
- Computes optimal allocations based on volatility, APY, and risk tolerance
- Validates rebalance proposals (min 1h between rebalances, min 5% allocation change)
- Maintains per-user allocation and risk state

This is a **key differentiator** for judging — it demonstrates Arbitrum Stylus usage with gas-efficient Rust computation.

### Deployed Addresses (Arbitrum Sepolia)

| Contract | Address | Arbiscan |
|----------|---------|----------|
| Vault | `0x92d7CeF16D139CB1A3a730f34361C3d56aC0d549` | [View](https://sepolia.arbiscan.io/address/0x92d7CeF16D139CB1A3a730f34361C3d56aC0d549) |
| StrategyRegistry | `0x0211FD438051De69ba9942F0aafE950b18875073` | [View](https://sepolia.arbiscan.io/address/0x0211FD438051De69ba9942F0aafE950b18875073) |
| Agent Executor (Stylus) | `0xe7fcf23dadab116e2adb5f3bdac4729c84e17781` | [View](https://sepolia.arbiscan.io/address/0xe7fcf23dadab116e2adb5f3bdac4729c84e17781) |
| Agent (deployer) | `0x4Ba1e9e275EF61B56C99532D0066506436201D73` | — |
| USDC | `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d` | [View](https://sepolia.arbiscan.io/address/0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d) |

---

## Frontend

Cyberpunk terminal-themed dashboard built with Next.js 15.

### User Flow

```
Connect Wallet → Deposit USDC → Set Strategy → Agent Monitors
     │               │              │              │
     │          (approve   (sliders or   (auto-rebalance
     │           USDC first) AI mode)     every ~5 min)
     ▼               ▼              ▼              ▼
  RainbowKit    ApprovalGuard   StrategyForm    Agent Log
```

### Pages & Components

| Component | Description |
|-----------|-------------|
| `Navbar` | Wallet connect, network guard (red alert if wrong chain) |
| `Dashboard` | Stats grid, Quick Start guide, live agent log |
| `VaultManager` | Deposit/withdraw toggle, amount input, MAX button, inline approval |
| `ApprovalGuard` | Shows when USDC allowance is insufficient; one-click approve |
| `StrategyForm` | Slider for stable/growth split, risk level selector, AI mode (NLP input) |
| `PositionCard` | Shares held, USD value, active strategy summary |
| `PortfolioChart` | 24h performance chart (reactive to live share price) |
| `TransactionToast` | Floating notifications with real tx confirmation status |

---

## Agent Runner

A Cloudflare Worker that runs every 5 minutes via cron trigger.

### What It Does
1. Reads vault state (`totalAssets`, `totalSupply`, user balances)
2. Computes optimal allocation based on position size
3. Submits `rebalance(user, newAllocationBps)` transactions
4. Supports optional OpenAI API integration for natural language strategy parsing

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/status` | Agent health check + contract addresses |
| `POST` | `/api/trigger` | Manually trigger a rebalance cycle |
| `POST` | `/api/parse-strategy` | Parse NL strategy via AI (body: `{ "text": "..." }`) |

---

## Local Development

### Prerequisites
- Node.js 18+
- pnpm (`npm i -g pnpm`)
- Foundry (`curl -L https://foundry.paradigm.xyz | bash && foundryup`)
- Rust (for Stylus; `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`)

### Setup

```bash
# Install frontend deps
pnpm install

# Install contract deps
cd contracts && forge install foundry-rs/forge-std && cd ..

# Run contract tests
cd contracts && forge test && cd ..

# Start frontend dev server
pnpm dev
# → http://localhost:3000
```

### Environment Variables

Create `contracts/.env`:
```env
RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
PRIVATE_KEY=your_wallet_private_key
```

For the agent, set Cloudflare secrets:
```bash
npx wrangler secret put AGENT_PRIVATE_KEY
npx wrangler secret put DGRID_API_KEY  # optional
```

---

## Deployment

```bash
# 1. Deploy contracts
cd contracts
forge script script/Deploy.s.sol \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc \
  --broadcast
# Update frontend/src/lib/contracts.ts with deployed addresses

# 2. Deploy frontend to Vercel
cd frontend && npx vercel --prod

# 3. Deploy agent to Cloudflare
cd agent && npx wrangler deploy
```

---

## Project Structure

```
arb/
├── contracts/                        # Smart contracts
│   ├── src/
│   │   ├── Vault.sol                # ERC4626 vault (deposit USDC, get shares)
│   │   ├── StrategyRegistry.sol      # Per-user strategy storage
│   │   └── interfaces/               # IERC4626, IStrategyRegistry
│   ├── stylus/agent-executor/        # Stylus (Rust) contract
│   │   └── src/lib.rs               # Allocation optimizer + rebalance validator
│   ├── test/Vault.t.sol             # 7 passing tests
│   ├── script/Deploy.s.sol          # Foundry deploy script
│   └── foundry.toml                 # Foundry config
├── frontend/                        # Next.js dapp
│   └── src/
│       ├── app/                     # Layout, page, globals.css (cyberpunk theme)
│       ├── components/              # Dashboard, Navbar, VaultManager, etc.
│       ├── hooks/useVault.ts        # Contract interactions (wagmi)
│       └── lib/                     # ABI definitions, wagmi config
├── agent/                           # Cloudflare Worker
│   ├── src/index.ts                 # Cron agent + REST API
│   └── wrangler.toml                # Worker config
├── package.json                     # Root workspace
└── pnpm-workspace.yaml             # pnpm monorepo config
```

---

## License

MIT — Built for Arbitrum Open House London 2026.

Questions? Reach out on [Arbitrum Discord](https://discord.gg/arbitrum) or open an issue.
