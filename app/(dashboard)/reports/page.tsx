"use client"

import { useEffect, useState } from "react"
import { Download, TrendingUp, TrendingDown, DollarSign, BarChart2, Globe, Users } from "lucide-react"
import { formatCurrency } from "@/lib/formatters"
import Select from "@/components/ui/Select"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from "recharts"

type ReportData = {
  period: { startDate: string; endDate: string }
  totalRevenue: number; totalExpenses: number; netProfit: number
  websiteProfitLoss: Array<{ domain: string; revenue: number; buyPrice: number; profit: number }>
  customerRevenue: Array<{ name: string; revenue: number; orderCount: number }>
  expensesByCategory: Record<string, number>
}

const CAT_LABELS: Record<string, string> = {
  WEBSITE_PURCHASE: "Mua website", VPS: "VPS/Hosting",
  DOMAIN_RENEWAL: "Gia hạn domain", PARTNER_SHARE: "Đối tác", OTHER: "Khác",
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1e2329] border border-[#2b3139] rounded-lg p-3 shadow-xl">
      <p className="text-xs text-[#848e9c] mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="text-xs font-semibold" style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("month")
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString())
  const [quarter, setQuarter] = useState("1")
  const [activeTab, setActiveTab] = useState<"overview" | "customers">("overview")

  useEffect(() => { fetchReport() }, [period, year, month, quarter])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ period, year })
      if (period === "month") p.append("month", month)
      if (period === "quarter") p.append("quarter", quarter)
      const data = await (await fetch(`/api/reports/profit-loss?${p}`)).json()
      // Only set report data if it has the expected structure
      if (data && typeof data === 'object') setReportData(data)
    } catch (e) {
      console.error(e)
    }
    finally { setLoading(false) }
  }

  const handleExport = () => {
    const p = new URLSearchParams({ period, year })
    if (period === "month") p.append("month", month)
    if (period === "quarter") p.append("quarter", quarter)
    window.open(`/api/reports/export?${p}`, "_blank")
  }

  const expensesChartData = reportData
    ? Object.entries(reportData.expensesByCategory).map(([cat, amt]) => ({
        category: CAT_LABELS[cat] || cat, amount: amt,
      }))
    : []

  const websiteChartData = reportData?.websiteProfitLoss.slice(0, 8).map(w => ({
    domain: w.domain.replace(/^https?:\/\//, "").slice(0, 15),
    revenue: w.revenue, buyPrice: w.buyPrice, profit: w.profit,
  })) ?? []

  const profitColor = (reportData?.netProfit ?? 0) >= 0 ? "#0ecb81" : "#f6465d"

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#eaecef]">Báo cáo Tài chính</h1>
          <p className="text-xs text-[#848e9c] mt-0.5">Phân tích lãi/lỗ và xuất báo cáo</p>
        </div>
        <button onClick={handleExport}
          className="flex items-center gap-1.5 text-xs text-[#0ecb81] bg-[#0ecb81]/10 border border-[#0ecb81]/20 px-3 py-1.5 rounded-lg font-medium hover:bg-[#0ecb81]/20 transition-colors">
          <Download size={13} /> Xuất Excel
        </button>
      </div>

      {/* Period filter */}
      <div className="bg-[#181a20] border border-[#2b3139] rounded-xl px-5 py-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs text-[#848e9c] mb-1.5 font-medium">Kỳ báo cáo</label>
          <Select
            value={period}
            onChange={setPeriod}
            options={[
              { value: "month", label: "Tháng" },
              { value: "quarter", label: "Quý" },
              { value: "year", label: "Năm" },
            ]}
            className="min-w-32"
          />
        </div>
        <div>
          <label className="block text-xs text-[#848e9c] mb-1.5 font-medium">Năm</label>
          <Select
            value={year}
            onChange={setYear}
            options={[2024, 2025, 2026].map(y => ({ value: y.toString(), label: y.toString() }))}
            className="min-w-24"
          />
        </div>
        {period === "month" && (
          <div>
            <label className="block text-xs text-[#848e9c] mb-1.5 font-medium">Tháng</label>
            <Select
              value={month}
              onChange={setMonth}
              options={Array.from({ length: 12 }, (_, i) => i + 1).map(m => ({
                value: m.toString(),
                label: `Tháng ${m}`
              }))}
              className="min-w-28"
            />
          </div>
        )}
        {period === "quarter" && (
          <div>
            <label className="block text-xs text-[#848e9c] mb-1.5 font-medium">Quý</label>
            <Select
              value={quarter}
              onChange={setQuarter}
              options={[1, 2, 3, 4].map(q => ({ value: q.toString(), label: `Quý ${q}` }))}
              className="min-w-24"
            />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#181a20] border border-[#2b3139] rounded-xl p-1 w-fit">
        {[
          { key: "overview", label: "Tổng quan", icon: BarChart2 },
          { key: "customers", label: "Khách hàng", icon: Users },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab.key
                ? "bg-[#fcd535] text-[#0b0e11]"
                : "text-[#848e9c] hover:text-[#eaecef]"
            }`}>
            <tab.icon size={12} />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-5 h-5 border-2 border-[#fcd535] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reportData ? (
        <>
          {/* KPI cards — always visible */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Tổng doanh thu", value: reportData.totalRevenue, icon: TrendingUp, color: "text-[#0ecb81]", bg: "bg-[#0ecb81]/10", positive: true },
              { label: "Tổng chi phí",   value: reportData.totalExpenses, icon: TrendingDown, color: "text-[#f6465d]", bg: "bg-[#f6465d]/10", positive: false },
              { label: "Lợi nhuận ròng", value: reportData.netProfit, icon: DollarSign, color: reportData.netProfit >= 0 ? "text-[#0ecb81]" : "text-[#f6465d]", bg: reportData.netProfit >= 0 ? "bg-[#0ecb81]/10" : "bg-[#f6465d]/10", positive: reportData.netProfit >= 0 },
            ].map((s, i) => (
              <div key={i} className="bg-[#181a20] border border-[#2b3139] rounded-xl p-5 flex items-center gap-4">
                <div className={`w-11 h-11 ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <s.icon size={20} className={s.color} />
                </div>
                <div>
                  <p className="text-xs text-[#848e9c] mb-1">{s.label}</p>
                  <p className={`text-xl font-bold font-mono ${s.color}`}>
                    {!s.positive && s.value > 0 ? "−" : s.value < 0 ? "−" : ""}
                    {formatCurrency(Math.abs(s.value))}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {activeTab === "overview" && (
            <>
              {/* Charts row */}
              <div className="grid lg:grid-cols-2 gap-4">
                {expensesChartData.length > 0 && (
                  <div className="bg-[#181a20] border border-[#2b3139] rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-5">
                      <BarChart2 size={14} className="text-[#f6465d]" />
                      <h2 className="text-sm font-bold text-[#eaecef]">Chi phí theo danh mục</h2>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={expensesChartData} barSize={28}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2b3139" vertical={false} />
                        <XAxis dataKey="category" stroke="#474d57" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#474d57" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="amount" name="Chi phí" radius={[4, 4, 0, 0]}>
                          {expensesChartData.map((_, i) => (
                            <Cell key={i} fill={`rgba(246,70,93,${0.9 - i * 0.1})`} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {websiteChartData.length > 0 && (
                  <div className="bg-[#181a20] border border-[#2b3139] rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-5">
                      <Globe size={14} className="text-[#fcd535]" />
                      <h2 className="text-sm font-bold text-[#eaecef]">Doanh thu / Lãi theo website</h2>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={websiteChartData} barSize={14}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2b3139" vertical={false} />
                        <XAxis dataKey="domain" stroke="#474d57" fontSize={9} tickLine={false} axisLine={false} />
                        <YAxis stroke="#474d57" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: "10px", color: "#848e9c" }} />
                        <Bar dataKey="revenue" name="Doanh thu" fill="#fcd535" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="profit" name="Lợi nhuận" fill="#0ecb81" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Website P&L table */}
              <div className="bg-[#181a20] border border-[#2b3139] rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#2b3139] flex items-center gap-2">
                  <Globe size={14} className="text-[#fcd535]" />
                  <h2 className="text-sm font-bold text-[#eaecef]">Lãi/lỗ theo Website</h2>
                </div>
                {reportData.websiteProfitLoss.length === 0 ? (
                  <div className="text-center py-12 text-sm text-[#848e9c]">Chưa có dữ liệu cho kỳ này</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#2b3139]">
                          {["Website", "Doanh thu", "Giá mua", "Lãi/lỗ", "Tỉ lệ"].map((h, i) => (
                            <th key={i} className="px-5 py-3 text-xs font-medium text-[#848e9c] uppercase tracking-wide text-left">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.websiteProfitLoss.map((w, i) => {
                          const isProfit = w.profit >= 0
                          const roi = w.buyPrice > 0 ? ((w.profit / w.buyPrice) * 100).toFixed(1) : "—"
                          return (
                            <tr key={i} className="border-b border-[#2b3139] last:border-0 hover:bg-[#1e2329] transition-colors">
                              <td className="px-5 py-3.5">
                                <span className="text-sm font-semibold text-[#eaecef]">{w.domain}</span>
                              </td>
                              <td className="px-5 py-3.5">
                                <span className="text-sm font-bold text-[#0ecb81] font-mono">{formatCurrency(w.revenue)}</span>
                              </td>
                              <td className="px-5 py-3.5">
                                <span className="text-xs text-[#848e9c] font-mono">{formatCurrency(w.buyPrice)}</span>
                              </td>
                              <td className="px-5 py-3.5">
                                <span className={`text-sm font-bold font-mono ${isProfit ? "text-[#0ecb81]" : "text-[#f6465d]"}`}>
                                  {isProfit ? "+" : "−"}{formatCurrency(Math.abs(w.profit))}
                                </span>
                              </td>
                              <td className="px-5 py-3.5">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${isProfit ? "bg-[#0ecb81]/10 text-[#0ecb81]" : "bg-[#f6465d]/10 text-[#f6465d]"}`}>
                                  {roi}%
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === "customers" && (
            <>
              {/* Customer revenue chart */}
              {reportData.customerRevenue.length > 0 && (
                <div className="bg-[#181a20] border border-[#2b3139] rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-5">
                    <Users size={14} className="text-[#5b8def]" />
                    <h2 className="text-sm font-bold text-[#eaecef]">Top khách hàng theo doanh thu</h2>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={reportData.customerRevenue.slice(0, 8).map(c => ({
                      name: c.name.length > 12 ? c.name.slice(0, 12) + "…" : c.name,
                      revenue: c.revenue,
                    }))} barSize={28}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2b3139" vertical={false} />
                      <XAxis dataKey="name" stroke="#474d57" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#474d57" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="revenue" name="Doanh thu" radius={[4, 4, 0, 0]}>
                        {reportData.customerRevenue.slice(0, 8).map((_, i) => (
                          <Cell key={i} fill={`rgba(91,141,239,${1 - i * 0.1})`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Customer revenue table */}
              <div className="bg-[#181a20] border border-[#2b3139] rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#2b3139] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-[#5b8def]" />
                    <h2 className="text-sm font-bold text-[#eaecef]">Doanh thu theo Khách hàng</h2>
                  </div>
                  <span className="text-xs text-[#848e9c]">{reportData.customerRevenue.length} khách</span>
                </div>
                {reportData.customerRevenue.length === 0 ? (
                  <div className="text-center py-12 text-sm text-[#848e9c]">Chưa có dữ liệu cho kỳ này</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#2b3139]">
                          {["#", "Khách hàng", "Số đơn", "Doanh thu", "TB/đơn", "% tổng"].map((h, i) => (
                            <th key={i} className={`px-5 py-3 text-xs font-medium text-[#848e9c] uppercase tracking-wide ${i === 0 ? "text-center w-10" : "text-left"}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.customerRevenue.map((c, i) => {
                          const avg = c.orderCount > 0 ? c.revenue / c.orderCount : 0
                          const pct = reportData.totalRevenue > 0 ? (c.revenue / reportData.totalRevenue * 100).toFixed(1) : "0"
                          return (
                            <tr key={i} className="border-b border-[#2b3139] last:border-0 hover:bg-[#1e2329] transition-colors">
                              <td className="px-5 py-3.5 text-center">
                                <span className={`text-xs font-bold ${i === 0 ? "text-[#fcd535]" : i === 1 ? "text-[#b7bdc6]" : i === 2 ? "text-[#cd7f32]" : "text-[#474d57]"}`}>
                                  {i + 1}
                                </span>
                              </td>
                              <td className="px-5 py-3.5">
                                <span className="text-sm font-semibold text-[#eaecef]">{c.name}</span>
                              </td>
                              <td className="px-5 py-3.5">
                                <span className="text-xs bg-[#2b3139] text-[#b7bdc6] px-2 py-0.5 rounded font-medium">{c.orderCount} đơn</span>
                              </td>
                              <td className="px-5 py-3.5">
                                <span className="text-sm font-bold text-[#0ecb81] font-mono">{formatCurrency(c.revenue)}</span>
                              </td>
                              <td className="px-5 py-3.5">
                                <span className="text-xs text-[#848e9c] font-mono">{formatCurrency(avg)}</span>
                              </td>
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 bg-[#2b3139] rounded-full overflow-hidden">
                                    <div className="h-full bg-[#5b8def] rounded-full" style={{ width: `${pct}%` }} />
                                  </div>
                                  <span className="text-xs text-[#5b8def] font-semibold">{pct}%</span>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-sm text-[#848e9c]">Không có dữ liệu</div>
      )}
    </div>
  )
}