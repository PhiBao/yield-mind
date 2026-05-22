# YieldMind — AGENTS.md

## Project Context

YieldMind is an AI-native yield automation platform for Arbitrum. Users deposit USDC, set a strategy (via sliders or natural language), and an AI agent auto-rebalances. Built for Arbitrum Open House London Buildathon.

**Key constraint**: deployable MVP in 3 weeks, $0 running cost (Vercel Hobby + Cloudflare Free).

---

## Code Conventions

### TypeScript / Frontend
- **React components**: function components, `"use client"` directive for interactive components
- **State management**: wagmi hooks (`useReadContract`, `useWriteContract`, `useAccount`) + React `useState`
- **No external state libs**: no Redux, Zustand, etc. — wagmi + React Query handles all state
- **CSS**: Tailwind utility classes with custom `terminal-*` color palette (defined in `tailwind.config.ts`)
- **Cyberpunk theme classes**: `.terminal-window`, `.btn-cyber`, `.input-cyber`, `.glow-text`, `.stat-value`
- **Imports**: path alias `@/` → `frontend/src/`

### Solidity / Contracts
- **Solidity version**: `0.8.26` (checked arithmetic by default)
- **Error handling**: custom errors (`error Unauthorized()`, not `require` strings)
- **Naming**: `_` prefix for internal storage (`totalAssets_`, `totalSupply_`), no prefix for external
- **Access control**: dedicated modifiers (`onlyAgent`, `onlyVault`, `onlyOwner`)
- **Interface pattern**: interfaces in `interfaces/`, structs defined in interface files
- **ERC20 safety**: always check return values of `transfer`/`transferFrom`
- **Tests**: Foundry (forge), use `vm.prank` + `vm.startPrank` for impersonation

### Rust / Stylus
- **Edition**: 2021
- **SDK**: `stylus-sdk 0.6`
- **Storage**: `sol_storage!` macro with `#[entrypoint]` attribute
- **No-std**: `#![no_std]` + `extern crate alloc`

### Agent / Cloudflare Worker
- **Runtime**: `@cloudflare/workers-types`
- **Cron**: `wrangler.toml` `[triggers]` with `crons = ["*/5 * * * *"]`
- **Secrets**: `wrangler secret put <NAME>` (not in config files)
- **RPC**: viem for blockchain interactions (not ethers.js)

---

## Architecture Decisions

### Why ERC4626 pattern (not custom vault)?
Standardized interface means familiar to judges, composable with future DeFi protocols. The vault is deliberately simplified (no external yield sources in MVP) to ship fast.

### Why Stylus (Rust) for the agent executor?
1. **Gas efficiency**: Rust compilation to WASM is ~10x cheaper than Solidity for compute-heavy logic
2. **Differentiator**: Most teams use only Solidity — Stylus shows deeper Arbitrum tech stack expertise
3. **Strategy math**: Allocation optimization involves non-trivial computation better suited to Rust

### Why Cloudflare Workers for the agent?
- **Free tier**: 100k requests/day covers cron at 5-min intervals (~288/day)
- **No infrastructure**: no server to maintain, no DDoS surface
- **Edge network**: global execution, minimal latency to Arbitrum RPC

### Why no real DeFi integration in MVP?
The vault manages an internal pool. In production, it would supply to Aave/GMX. For the hackathon, the architecture is correct (ERC4626 + agent rebalancing) and the demo shows the full flow. Real integration is a post-MVP milestone that judges can see in the architecture.

### Why not use foundry's `--verify` in deploy script?
The deploy script doesn't include auto-verify because it requires an Etherscan API key. Verification is a manual post-deploy step to avoid leaking API keys in broadcast files.

---

## Testing

```bash
# Run contract tests
cd contracts && forge test

# Run a specific test
forge test --match-test test_Deposit -vvv

# Gas report
forge test --gas-report

# Frontend build check
cd frontend && npx next build
```

### Test Design
- `Vault.t.sol`: 7 tests covering deposit, withdraw, rebalance, access control, and edge cases
- MockERC20 simulates USDC (6 decimals)
- Tests use `vm.assume` for fuzzing (add more for production)

---

## Common Pitfalls

1. **StrategyRegistry.getStrategy reverts**: If no strategy exists for a user and they're not the owner, `getStrategy` reverts with `StrategyNotFound`. Always handle this in the frontend (the hook returns `null` on error).

2. **Vault ↔ Registry link**: After deploying both contracts, `registry.setVault(vault)` must be called. The deploy script does this automatically now, but if deploying manually, don't forget.

3. **USDC decimals**: USDC uses 6 decimals, not 18. All `parseUnits`/`formatUnits` calls use `6` as the second argument. The vault's `decimals()` returns `6`.

4. **Agent private key**: The Cloudflare Worker needs the deployer's private key to call `rebalance()`. Store it as a Cloudflare secret, never in `wrangler.toml`.

5. **Stylus deployment**: Deployed to Arbitrum Sepolia at `0xe7fcf23dadab116e2adb5f3bdac4729c84e17781`. Uses `stylus-sdk 0.10.7`. Deploy via `cargo stylus deploy --no-verify --private-key <KEY> --endpoint <RPC> --wasm-file target/wasm32-unknown-unknown/release/agent_executor.wasm`.

---

## Future Improvements (Post-MVP)

- [ ] Integrate with Aave/GMX for real yield
- [ ] Multi-asset vault support (ETH, wBTC, ARB)
- [ ] User dashboard with historical performance tracking
- [ ] Social/telegram agent notifications
- [ ] Strategy marketplace (share/template strategies)
- [ ] Flash loan protection for rebalancing
- [ ] Deploy on Robinhood Chain for dual-track prize eligibility
- [ ] Gas optimization pass on Stylus contracts
