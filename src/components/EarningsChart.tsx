"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const PLACEHOLDER_DATA = [
  { date: "Mon", earnings: 0 },
  { date: "Tue", earnings: 0 },
  { date: "Wed", earnings: 0 },
  { date: "Thu", earnings: 0 },
  { date: "Fri", earnings: 0 },
  { date: "Sat", earnings: 0 },
  { date: "Sun", earnings: 0 },
];

interface ChartDataPoint {
  date: string;
  earnings: number;
}

interface EarningsChartProps {
  data?: ChartDataPoint[];
}

export function EarningsChart({ data }: EarningsChartProps) {
  const chartData =
    data && data.length > 0
      ? data.map((d) => ({ time: d.date, earnings: d.earnings }))
      : PLACEHOLDER_DATA.map((d) => ({ time: d.date, earnings: d.earnings }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="time"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#6B7280" }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#6B7280" }}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            formatter={(value) => [`$${Number(value).toFixed(2)}`, "Earnings"]}
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          />
          <Area
            type="monotone"
            dataKey="earnings"
            stroke="#10B981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorEarnings)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
