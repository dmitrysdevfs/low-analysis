"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminDonutChart } from "@/admin/components/AdminDonutChart/AdminDonutChart";
import type {
  AnalysisHistogramBucket,
  AnalysisScatterPoint,
  GlobalDistributionSegment,
  GlobalTimelinePoint,
  GlobalTopLawRow,
} from "../types";

const chartTheme = {
  stroke: "rgba(166, 190, 220, 0.18)",
  axis: "#9eb5d9",
  text: "#c7d5ea",
  tooltipBackground: "rgba(9,18,38,0.96)",
  tooltipBorder: "1px solid rgba(255,255,255,0.12)",
};

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; payload?: unknown; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        background: chartTheme.tooltipBackground,
        border: chartTheme.tooltipBorder,
        borderRadius: 14,
        padding: "10px 12px",
        boxShadow: "0 16px 30px rgba(0,0,0,0.24)",
      }}
    >
      {label ? (
        <div
          style={{
            color: "#fff1bf",
            fontFamily: "var(--font-mono)",
            fontSize: "0.72rem",
            letterSpacing: "0.08em",
            marginBottom: 6,
          }}
        >
          {label}
        </div>
      ) : null}
      <div style={{ display: "grid", gap: 6 }}>
        {payload.map((item) => (
          <div
            key={`${item.name}-${item.color}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              color: chartTheme.text,
              fontSize: "0.8rem",
            }}
          >
            <span>{item.name}</span>
            <strong style={{ color: "#ffffff" }}>{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GlobalTimelineChart({
  points,
}: {
  points: GlobalTimelinePoint[];
}) {
  if (!points.length) return null;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={points}>
        <defs>
          <linearGradient id="lawsGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#4a80d4" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#4a80d4" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="articlesGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#c8a843" stopOpacity={0.46} />
            <stop offset="100%" stopColor="#c8a843" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={chartTheme.stroke} />
        <XAxis dataKey="label" tick={{ fill: chartTheme.axis, fontSize: 11 }} />
        <YAxis tick={{ fill: chartTheme.axis, fontSize: 11 }} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="cumulativeArticles"
          stroke="#c8a843"
          fill="url(#articlesGradient)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="cumulativeLaws"
          stroke="#4a80d4"
          fill="url(#lawsGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function GlobalTopLawsChart({
  rows,
}: {
  rows: GlobalTopLawRow[];
}) {
  if (!rows.length) return null;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={rows} layout="vertical" margin={{ left: 18 }}>
        <CartesianGrid horizontal={false} stroke={chartTheme.stroke} />
        <XAxis type="number" tick={{ fill: chartTheme.axis, fontSize: 11 }} />
        <YAxis
          type="category"
          dataKey="code"
          width={80}
          tick={{ fill: chartTheme.axis, fontSize: 11 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="articles" fill="#4a80d4" radius={[0, 8, 8, 0]} />
        <Bar dataKey="paragraphs" fill="#c8a843" radius={[0, 8, 8, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SubjectDistributionChart({
  segments,
}: {
  segments: GlobalDistributionSegment[];
}) {
  return (
    <AdminDonutChart
      segments={segments.map((segment) => ({
        label: segment.label,
        value: segment.count,
        color: segment.color,
      }))}
      centerValue={segments.reduce((sum, segment) => sum + segment.count, 0)}
      centerLabel="суб'єктів"
      size={210}
    />
  );
}

export function HistogramChart({
  data,
}: {
  data: AnalysisHistogramBucket[];
}) {
  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid vertical={false} stroke={chartTheme.stroke} />
        <XAxis dataKey="label" tick={{ fill: chartTheme.axis, fontSize: 10 }} />
        <YAxis tick={{ fill: chartTheme.axis, fontSize: 11 }} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" radius={[8, 8, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`${entry.label}-${index}`}
              fill={index >= data.length - 2 ? "#e9774b" : "#4a80d4"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ScatterFactorChart({
  data,
}: {
  data: AnalysisScatterPoint[];
}) {
  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ScatterChart>
        <CartesianGrid stroke={chartTheme.stroke} />
        <XAxis
          type="number"
          dataKey="chars"
          name="Символи"
          tick={{ fill: chartTheme.axis, fontSize: 11 }}
        />
        <YAxis
          type="number"
          dataKey="subjects"
          name="Суб'єкти"
          tick={{ fill: chartTheme.axis, fontSize: 11 }}
        />
        <Tooltip
          cursor={{ strokeDasharray: "4 4" }}
          content={<CustomTooltip />}
        />
        <Scatter data={data} fill="#4a80d4">
          {data.map((point) => (
            <Cell
              key={point.id}
              fill={
                point.factor >= 68
                  ? "#e9774b"
                  : point.factor >= 38
                    ? "#c8a843"
                    : "#4a80d4"
              }
            />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export function RiskMixChart({
  green,
  yellow,
  red,
}: {
  green: number;
  yellow: number;
  red: number;
}) {
  const data = [
    { label: "Норма", value: green, color: "#4aad7a" },
    { label: "Увага", value: yellow, color: "#c8a843" },
    { label: "Викид", value: red, color: "#e9774b" },
  ];

  return (
    <AdminDonutChart
      segments={data}
      centerValue={green + yellow + red}
      centerLabel="елементів"
      size={210}
    />
  );
}
