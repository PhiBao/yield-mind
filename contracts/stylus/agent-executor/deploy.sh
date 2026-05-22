#!/usr/bin/env bash
set -euo pipefail

RPC_URL="${RPC_URL:-https://sepolia-rollup.arbitrum.io/rpc}"
PRIVATE_KEY="${PRIVATE_KEY:?Must set PRIVATE_KEY env var}"
WASM="target/wasm32-unknown-unknown/release/agent_executor.wasm"

echo "==> Building release WASM..."
cargo build --target wasm32-unknown-unknown --release

echo "==> Deploying via cargo-stylus..."
cargo stylus deploy --no-verify \
  --private-key "$PRIVATE_KEY" \
  --endpoint "$RPC_URL" \
  --wasm-file "$WASM" \
  --max-fee-per-gas-gwei 100
