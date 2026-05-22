export interface StrategyData {
  allocationBps: bigint;
  riskLevel: number;
  rebalanceThreshold: bigint;
  active: boolean;
}

export interface VaultPosition {
  shares: bigint;
  assets: bigint;
  usdcBalance: bigint;
}

export interface PortfolioPoint {
  timestamp: number;
  value: number;
}

export interface AgentStatus {
  running: boolean;
  lastExecution: number;
  nextExecution: number;
  strategyCount: number;
}
