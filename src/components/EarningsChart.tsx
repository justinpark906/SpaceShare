"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const hourlyData = [
  { time: "6am", earnings: 0 },
  { time: "7am", earnings: 3.5 },
  { time: "8am", earnings: 7.0 },
  { time: "9am", earnings: 12.5 },
  { time: "10am", earnings: 15.0 },
  { time: "11am", earnings: 22.0 },
  { time: "12pm", earnings: 28.5 },
  { time: "1pm", earnings: 32.0 },
  { time: "2pm", earnings: 38.0 },
  { time: "3pm", earnings: 42.5 },
  { time: "4pm", earnings: 47.2 },
  { time: "Now", earnings: 47.2 },
];

export function EarningsChart() {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={hourlyData}
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
