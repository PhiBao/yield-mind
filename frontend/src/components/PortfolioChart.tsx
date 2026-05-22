"use client";

import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Area, AreaChart } from "recharts";

export function PortfolioChart({ currentValue = 0, sharePrice = 1 }: { currentValue: number; sharePrice: number }) {
  const data = useMemo(() => {
    const points = 24;
    const startValue = currentValue > 0 ? currentValue * 0.92 : 1000;
    const now = Date.now();
    const values: number[] = [];
    for (let i = 0; i < points; i++) {
      const progress = i / (points - 1);
      const trend = startValue * (1 + progress * (sharePrice - 1));
      const noise = trend * (Math.random() - 0.5) * 0.02;
      values.push(trend + noise);
    }
    return values.map((v, i) => ({
      timestamp: now - (points - 1 - i) * 3600000,
      value: v,
    }));
  }, [currentValue, sharePrice]);

  const change = data.length >= 2
    ? ((data[data.length - 1].value - data[0].value) / data[0].value * 100)
    : 0;

  const isPositive = change >= 0;

  return (
    <div className="terminal-window p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-terminal-green animate-pulse" />
          <span className="text-xs font-mono text-terminal-muted uppercase tracking-wider">Performance (24h)</span>
        </div>
        <span className={`text-xs font-mono ${isPositive ? "text-terminal-green" : "text-terminal-red"} glow-text`}>
          {isPositive ? "+" : ""}{change.toFixed(2)}%
        </span>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00ff41" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#00ff41" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2448" />
            <XAxis dataKey="timestamp" hide />
            <YAxis hide domain={["dataMin - (dataMax - dataMin) * 0.1", "dataMax + (dataMax - dataMin) * 0.1"]} />
            <Tooltip
              contentStyle={{
                background: "#0d1117",
                border: "1px solid #1e2448",
                borderRadius: "8px",
                fontSize: "12px",
                fontFamily: "JetBrains Mono, monospace",
              }}
              labelStyle={{ color: "#6b7294" }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, "Value"]}
              labelFormatter={(ts: number) => new Date(ts).toLocaleTimeString()}
            />
            <Area type="monotone" dataKey="value" stroke="#00ff41" strokeWidth={2} fill="url(#fillGradient)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
