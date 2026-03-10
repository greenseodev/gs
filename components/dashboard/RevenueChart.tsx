"use client"

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts"

type ChartData = {
  month: string
  revenue: number
  expense: number
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#181a20] border border-[#2b3139] rounded-lg shadow-2xl px-3 py-2.5 text-xs">
        <p className="text-[#848e9c] mb-1.5 font-medium">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.fill }} className="font-semibold">
            {p.name === "revenue" ? "Doanh thu" : "Chi phí"}: ${Number(p.value).toFixed(2)} USDT
          </p>
        ))}
        {payload.length === 2 && (
          <p className={`mt-1 font-bold ${payload[0].value - payload[1].value >= 0 ? "text-[#0ecb81]" : "text-[#f6465d]"}`}>
            Lãi: ${(payload[0].value - payload[1].value).toFixed(2)} USDT
          </p>
        )}
      </div>
    )
  }
  return null
}

export default function RevenueChart({ data }: { data: ChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} barSize={20} barGap={4} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2b3139" vertical={false} />
        <XAxis dataKey="month" stroke="#848e9c" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="#848e9c" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} width={44} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#1e2329" }} />
        <Bar dataKey="revenue" fill="#0ecb81" radius={[4, 4, 0, 0]} name="revenue" />
        <Bar dataKey="expense" fill="#f6465d" radius={[4, 4, 0, 0]} name="expense" />
      </BarChart>
    </ResponsiveContainer>
  )
}