"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TimeSeriesPoint } from "@/types/firstidp";

export function LineChart({ data, color = "var(--chart-1)", label }: { data: TimeSeriesPoint[]; color?: string; label: string }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 0, right: 8, top: 16, bottom: 0 }}>
          <defs>
            <linearGradient id={`gradient-${label.replace(/\s+/g, "-")}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{ fill: "var(--chart-axis)", fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis tick={{ fill: "var(--chart-axis)", fontSize: 11 }} tickLine={false} axisLine={false} width={36} allowDecimals={false} />
          <Tooltip
            cursor={{ stroke: "var(--chart-grid)" }}
            contentStyle={{
              background: "var(--surface-control)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              color: "var(--text)",
            }}
          />
          <Area type="monotone" dataKey="current" name={label} stroke={color} strokeWidth={2} fill={`url(#gradient-${label.replace(/\s+/g, "-")})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
