"use client";

import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface SparklineChartProps {
  data: number[];
  color?: string;
  height?: number;
}

export function SparklineChart({
  data,
  color = "#c8a843",
  height = 48,
}: SparklineChartProps) {
  if (!data.length) return null;
  const chartData = data.map((value, index) => ({ index, value }));
  const gradientId = `spark-${color.replace("#", "")}`;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip
          contentStyle={{
            background: "rgba(9,18,38,0.95)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 10,
            fontSize: "0.72rem",
            color: "#c7d5ea",
          }}
          itemStyle={{ color: "#ffffff" }}
          formatter={(v: unknown) => [Number(v), ""]}
          labelFormatter={() => ""}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#${gradientId})`}
          dot={false}
          isAnimationActive={true}
          animationDuration={600}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
