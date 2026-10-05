"use client"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
const data = [
  { day: "1 Oct", previous: 12000, revenue: 16000 },
  { day: "3 Oct", previous: 17000, revenue: 21000 },
  { day: "5 Oct", previous: 14000, revenue: 17000 },
  { day: "7 Oct", previous: 21000, revenue: 28000 },
  { day: "9 Oct", previous: 18000, revenue: 23000 },
  { day: "11 Oct", previous: 23000, revenue: 31000 },
  { day: "13 Oct", previous: 19000, revenue: 28000 },
  { day: "15 Oct", previous: 26000, revenue: 35000 },
  { day: "17 Oct", previous: 25000, revenue: 30000 },
  { day: "19 Oct", previous: 28000, revenue: 37000 },
  { day: "21 Oct", previous: 24000, revenue: 35000 },
  { day: "23 Oct", previous: 31000, revenue: 44000 },
  { day: "25 Oct", previous: 29000, revenue: 40000 },
  { day: "27 Oct", previous: 34000, revenue: 46000 },
  { day: "30 Oct", previous: 32000, revenue: 42500 },
]
export default function RevenueChart({ period }: { period: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={
          period === "Last 7 days"
            ? data.slice(-4)
            : period === "Last month"
              ? data.map((d) => ({ ...d, revenue: d.previous }))
              : data
        }
        margin={{ top: 10, right: 4, left: -20, bottom: 0 }}
      >
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-brand-200)"
              stopOpacity={0.65}
            />
            <stop
              offset="100%"
              stopColor="var(--color-brand-50)"
              stopOpacity={0.1}
            />
          </linearGradient>
        </defs>
        <CartesianGrid
          stroke="var(--color-line)"
          vertical={false}
          strokeDasharray="3 4"
        />
        <XAxis
          dataKey="day"
          axisLine={false}
          tickLine={false}
          minTickGap={35}
          tick={{ className: "text-xs", fill: "var(--color-muted)" }}
          dy={9}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ className: "text-xs", fill: "var(--color-muted)" }}
          ticks={[0, 15000, 30000, 45000, 60000]}
          tickFormatter={(v) => `${v / 1000}k`}
        />
        <Tooltip formatter={(v) => `KES ${Number(v).toLocaleString()}`} />
        <Area
          isAnimationActive={false}
          name="Previous period"
          type="monotone"
          dataKey="previous"
          stroke="var(--color-brand-200)"
          strokeDasharray="4 4"
          fill="transparent"
          strokeWidth={1.5}
        />
        <Area
          isAnimationActive={false}
          name="Revenue"
          type="monotone"
          dataKey="revenue"
          stroke="var(--color-brand-600)"
          strokeWidth={2.5}
          fill="url(#revenueFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
