"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface AdminDonutChartProps {
  segments: DonutSegment[];
  centerLabel?: string;
  centerValue?: string | number;
  size?: number;
}

export function AdminDonutChart({
  segments,
  centerLabel,
  centerValue,
  size = 200,
}: AdminDonutChartProps) {
  const data = segments.filter((s) => s.value > 0);
  if (!data.length) return null;

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={size * 0.28}
            outerRadius={size * 0.44}
            paddingAngle={2}
            dataKey="value"
            isAnimationActive
            animationDuration={700}
          >
            {data.map((entry) => (
              <Cell key={entry.label} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "rgba(9,18,38,0.96)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12,
              fontSize: "0.78rem",
              color: "#c7d5ea",
            }}
            formatter={(value: unknown, name: unknown) => [Number(value), String(name)]}
          />
        </PieChart>
      </ResponsiveContainer>
      {(centerValue !== undefined || centerLabel) && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          {centerValue !== undefined && (
            <strong style={{ color: "#ffffff", fontSize: "1.5rem", lineHeight: 1 }}>
              {centerValue}
            </strong>
          )}
          {centerLabel && (
            <span style={{ color: "#9eb5d9", fontSize: "0.68rem", marginTop: 4, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {centerLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
