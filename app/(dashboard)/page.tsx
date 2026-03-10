import { prisma } from "@/lib/prisma"
import { formatCurrency, formatType, calcItemTotal, calcOrderTotal } from "@/lib/formatters"
import {
  startOfMonth, addDays, subMonths, format
} from "date-fns"
import {
  TrendingUp, TrendingDown, Link2, Wallet,
  AlertTriangle, ArrowRight, ShoppingCart,
  Globe, DollarSign, Users, AlertCircle
} from "lucide-react"
import RevenueChart from "@/components/dashboard/RevenueChart"
import Link from "next/link"

// Helper function to calculate order total with discount
function calculateOrderTotal(order: any) {
  return calcOrderTotal(order.orderItems, order.discount ?? 0)
}

async function getDashboardStats() {
  const now = new Date()
  const monthStart = startOfMonth(now)
  const prevMonthStart = startOfMonth(subMonths(now, 1))
  const twoDaysFromNow = addDays(now, 2)

  const [
    paidOrdersMonth,
    paidOrdersPrevMonth,
    paidOrdersAllTime,
    expensesMonth,
    activeTextlinks,
    totalWebsites,
    expiringTextlinks,
    expiredUnrenewed,
    unpaidOrders,
    recentWebsites,
    topWebsiteRaw,
    topCustomerRaw,
    allTextlinkPrices,
    occupiedSlots,
    orderStatusCounts,
  ] = await Promise.all([
    prisma.order.findMany({
      where: { paymentStatus: "PAID", createdAt: { gte: monthStart } },
      include: { orderItems: { include: { entries: true } as any }, customer: true },
    } as any),
    prisma.order.findMany({
      where: { paymentStatus: "PAID", createdAt: { gte: prevMonthStart, lt: monthStart } },
      include: { orderItems: { include: { entries: true } as any } },
    } as any),
    prisma.order.findMany({
      where: { paymentStatus: "PAID" },
      include: { orderItems: { include: { entries: true } as any } },
    } as any),
    prisma.expense.aggregate({
      where: { date: { gte: monthStart } },
      _sum: { amount: true },
    }),
    prisma.orderItem.count({ where: { status: "ACTIVE" } }),
    prisma.website.count(),
    prisma.orderItem.findMany({
      where: { status: "ACTIVE", endDate: { lte: twoDaysFromNow, gte: now } },
      include: { website: true, order: { include: { customer: true } } },
      orderBy: { endDate: "asc" },
    }),
    prisma.orderItem.findMany({
      where: { status: "ACTIVE", endDate: { lt: now } },
      include: { website: true, order: { include: { customer: true } } },
      orderBy: { endDate: "desc" },
      take: 5,
    }),
    prisma.order.findMany({
      where: { paymentStatus: { in: ["UNPAID", "DEBT"] } },
      include: { customer: true, orderItems: { include: { entries: true } as any } },
      orderBy: { createdAt: "desc" },
      take: 5,
    } as any),
    prisma.website.findMany({
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.orderItem.groupBy({
      by: ["websiteId"],
      where: { order: { paymentStatus: "PAID" }, createdAt: { gte: monthStart } },
      _sum: { unitPrice: true },
      orderBy: { _sum: { unitPrice: "desc" } },
      take: 5,
    }),
    prisma.orderItem.groupBy({
      by: ["orderId"],
      where: { order: { paymentStatus: "PAID" }, createdAt: { gte: monthStart } },
      _sum: { unitPrice: true },
    }),
    prisma.textlinkPrice.findMany({ select: { websiteId: true, type: true } }),
    prisma.orderItem.findMany({
      where: { status: "ACTIVE" },
      select: { websiteId: true, type: true },
    }),
    prisma.order.groupBy({
      by: ["paymentStatus"],
      where: { createdAt: { gte: monthStart } },
      _count: true,
    }),
  ])

  // Top websites - Calculate from paidOrdersMonth
  const websiteRevenueMap: Record<string, number> = {}
  for (const order of paidOrdersMonth) {
    for (const item of (order as any).orderItems) {
      const entriesCount = item.entries?.length ?? 1
      const itemTotal = calcItemTotal(item.unitPrice, entriesCount)
      const itemRevenue = itemTotal * (1 - ((order as any).discount ?? 0) / 100) / (order as any).orderItems.length
      websiteRevenueMap[item.websiteId] = (websiteRevenueMap[item.websiteId] ?? 0) + itemRevenue
    }
  }
  const topWebsiteIds = Object.keys(websiteRevenueMap).slice(0, 5)
  const topWebsiteDetails = await prisma.website.findMany({ where: { id: { in: topWebsiteIds } } })
  const topWebsites = Object.entries(websiteRevenueMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([websiteId, revenue]) => ({
      domain: topWebsiteDetails.find((w: any) => w.id === websiteId)?.domain ?? "—",
      revenue,
    }))

  // Top customers - Calculate from paidOrdersMonth
  const customerRevenueMap: Record<string, { name: string; revenue: number }> = {}
  for (const order of paidOrdersMonth) {
    const total = calculateOrderTotal(order)
    const customerId = order.customerId
    if (!customerRevenueMap[customerId]) {
      customerRevenueMap[customerId] = { name: (order as any).customer?.name ?? "—", revenue: 0 }
    }
    customerRevenueMap[customerId].revenue += total
  }
  const topCustomers = Object.values(customerRevenueMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // Empty slots
  const slotSet = new Set(allTextlinkPrices.map((p: any) => `${p.websiteId}-${p.type}`))
  const occupiedSet = new Set(occupiedSlots.map((o: any) => `${o.websiteId}-${o.type}`))
  const emptySlotIds = [...slotSet].filter((s) => !occupiedSet.has(s))
  const emptySlotWebsiteIds = [...new Set(emptySlotIds.map((s) => s.split("-")[0]))]
  const emptySlotWebsites = await prisma.website.findMany({
    where: { id: { in: emptySlotWebsiteIds } },
    take: 5,
  })
  const emptySlots = emptySlotWebsites.map((w: any) => {
    const types = emptySlotIds
      .filter((s) => s.startsWith(w.id))
      .map((s) => s.split("-")[1])
    return { domain: w.domain, types }
  })

  // Chart data
  const chartData = await Promise.all(
    Array.from({ length: 6 }, async (_, i) => {
      const monthDate = subMonths(now, 5 - i)
      const mStart = startOfMonth(monthDate)
      const mEnd = startOfMonth(addDays(monthDate, 32))
      const [orders, exp] = await Promise.all([
        prisma.order.findMany({
          where: { paymentStatus: "PAID", createdAt: { gte: mStart, lt: mEnd } },
          include: { orderItems: { include: { entries: true } as any } },
        } as any),
        prisma.expense.aggregate({
          where: { date: { gte: mStart, lt: mEnd } },
          _sum: { amount: true },
        }),
      ])
      return {
        month: format(monthDate, "MM/yyyy"),
        revenue: orders.reduce((sum, order) => sum + calculateOrderTotal(order), 0),
        expense: exp._sum.amount ?? 0,
      }
    })
  )

  const revenueMonthVal = paidOrdersMonth.reduce((sum, order) => sum + calculateOrderTotal(order), 0)
  const revenuePrevMonthVal = paidOrdersPrevMonth.reduce((sum, order) => sum + calculateOrderTotal(order), 0)
  const revenueAllTimeVal = paidOrdersAllTime.reduce((sum, order) => sum + calculateOrderTotal(order), 0)
  const expensesMonthVal = expensesMonth._sum.amount ?? 0
  const netProfit = revenueMonthVal - expensesMonthVal
  const revenueChange = revenuePrevMonthVal === 0 ? null
    : ((revenueMonthVal - revenuePrevMonthVal) / revenuePrevMonthVal) * 100

  const unpaidTotal = unpaidOrders.reduce((sum: number, o: any) => sum + calculateOrderTotal(o), 0)

  const statusMap: Record<string, number> = {}
  orderStatusCounts.forEach((s: any) => { statusMap[s.paymentStatus] = s._count })

  const totalSlots = allTextlinkPrices.length
  const occupiedCount = occupiedSlots.length

  return {
    revenueMonth: revenueMonthVal,
    revenueChange,
    revenueAllTime: revenueAllTimeVal,
    expensesMonth: expensesMonthVal,
    netProfit,
    activeTextlinks,
    totalWebsites,
    totalSlots,
    occupiedCount,
    expiringTextlinks,
    expiredUnrenewed,
    unpaidOrders,
    unpaidTotal,
    recentWebsites,
    topWebsites,
    topCustomers,
    emptySlots,
    chartData,
    statusMap,
  }
}

function ChangeBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-xs text-[#848e9c]">Chưa có dữ liệu tháng trước</span>
  const up = pct >= 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${up ? "text-[#0ecb81]" : "text-[#f6465d]"}`}>
      {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {up ? "+" : ""}{pct.toFixed(1)}% so với tháng trước
    </span>
  )
}

function KPICard({
  label, value, sub, icon: Icon, bg, iconBg, valueColor, border,
}: {
  label: string; value: string; sub?: string; icon: any
  bg: string; iconBg: string; valueColor: string; border: string
}) {
  return (
    <div className={`${bg} border ${border} rounded-xl p-4 flex items-start justify-between card-hover`}>
      <div className="min-w-0 flex-1 pr-2">
        <p className="text-xs text-[#848e9c] mb-1.5">{label}</p>
        <p className={`text-lg font-bold font-mono ${valueColor} truncate`}>{value}</p>
        {sub && <p className="text-xs text-[#848e9c] mt-0.5">{sub}</p>}
      </div>
      <div className={`${iconBg} w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0`}>
        <Icon size={14} className="text-white" />
      </div>
    </div>
  )
}

function SectionCard({ title, link, children }: { title: string; link?: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#181a20] border border-[#2b3139] rounded-xl p-5 card-hover">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-[#eaecef]">{title}</h2>
        {link && (
          <Link href={link} className="text-xs text-[#0ecb81] hover:text-[#0bb871] flex items-center gap-0.5 transition-colors">
            Xem tất cả <ArrowRight size={11} />
          </Link>
        )}
      </div>
      {children}
    </div>
  )
}

function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="text-center py-7">
      <Icon size={22} className="text-[#474d57] mx-auto mb-2" />
      <p className="text-xs text-[#848e9c]">{text}</p>
    </div>
  )
}

export default async function DashboardPage() {
  const s = await getDashboardStats()

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#eaecef]">Dashboard</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#181a20] border border-[#2b3139] rounded-lg text-xs text-[#b7bdc6]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0ecb81]"></span>
              {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#5b8def]/10 border border-[#5b8def]/20 rounded-lg text-[11px] text-[#5b8def] font-medium">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Doanh Thu Và Chi Phí Được Tính Từ Tháng 3 Năm 2026
            </span>
          </div>
        </div>
      </div>

      {/* ── Cảnh báo ── */}
      {(s.expiringTextlinks.length > 0 || s.expiredUnrenewed.length > 0) && (
        <div className="space-y-2">
          {s.expiringTextlinks.length > 0 && (
            <div className="bg-[#f0b90b]/10 border border-[#f0b90b]/20 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle size={13} className="text-[#f0b90b]" />
                  <span className="text-xs font-semibold text-[#f0b90b]">
                    {s.expiringTextlinks.length} textlink sắp hết hạn trong 2 ngày
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                {s.expiringTextlinks.map((item: any) => (
                  <div key={item.id} className="bg-[#181a20] border border-[#2b3139] rounded-lg px-3 py-2 flex justify-between items-center">
                    <div>
                      <span className="text-xs font-semibold text-[#eaecef]">{item.website.domain}</span>
                      <span className="text-xs text-[#848e9c] ml-2">
                        {(item as any).order.customer.name} · {formatType((item as any).type)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#f0b90b]/10 border border-[#f0b90b]/20 rounded text-xs font-semibold text-[#f0b90b]">
                        {new Date(item.endDate).toLocaleDateString("vi-VN")}
                      </span>
                      <Link href={`/orders/${item.orderId}`} className="text-xs text-[#0b0e11] bg-[#fcd535] px-2 py-0.5 rounded hover:bg-[#f0b90b] transition-colors font-medium">
                        Gia hạn
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {s.expiredUnrenewed.length > 0 && (
            <div className="bg-[#f6465d]/10 border border-[#f6465d]/20 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <AlertCircle size={13} className="text-[#f6465d]" />
                <span className="text-xs font-semibold text-[#f6465d]">
                  {s.expiredUnrenewed.length} textlink đã hết hạn chưa được gia hạn
                </span>
              </div>
              <div className="space-y-1.5">
                {s.expiredUnrenewed.map((item: any) => (
                  <div key={item.id} className="bg-[#181a20] border border-[#2b3139] rounded-lg px-3 py-2 flex justify-between items-center">
                    <div>
                      <span className="text-xs font-semibold text-[#eaecef]">{item.website.domain}</span>
                      <span className="text-xs text-[#848e9c] ml-2">
                        {(item as any).order.customer.name} · {formatType((item as any).type)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#f6465d]/10 border border-[#f6465d]/20 rounded text-xs font-semibold text-[#f6465d]">
                        Hết {new Date(item.endDate).toLocaleDateString("vi-VN")}
                      </span>
                      <Link href={`/orders/${item.orderId}`} className="text-xs text-white bg-[#f6465d] px-2 py-0.5 rounded hover:bg-[#c9374a] transition-colors font-medium">
                        Liên hệ
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 6 KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Doanh thu tháng */}
        <div className="bg-[#0ecb81]/10 border border-[#0ecb81]/20 rounded-xl p-4 card-hover">
          <div className="flex items-start justify-between mb-2">
            <p className="text-xs text-[#848e9c]">Doanh thu tháng này</p>
            <div className="w-7 h-7 bg-[#0ecb81] rounded-md flex items-center justify-center flex-shrink-0">
              <TrendingUp size={13} className="text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#0ecb81] mb-1 font-mono">{formatCurrency(s.revenueMonth)}</p>
          <ChangeBadge pct={s.revenueChange} />
        </div>

        {/* Lãi ròng */}
        <div className={`border rounded-xl p-4 card-hover ${s.netProfit >= 0 ? "bg-[#0ecb81]/10 border-[#0ecb81]/20" : "bg-[#f6465d]/10 border-[#f6465d]/20"}`}>
          <div className="flex items-start justify-between mb-2">
            <p className="text-xs text-[#848e9c]">Lãi ròng tháng này</p>
            <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${s.netProfit >= 0 ? "bg-[#0ecb81]" : "bg-[#f6465d]"}`}>
              {s.netProfit >= 0 ? <TrendingUp size={13} className="text-white" /> : <TrendingDown size={13} className="text-white" />}
            </div>
          </div>
          <p className={`text-2xl font-bold mb-1 font-mono ${s.netProfit >= 0 ? "text-[#0ecb81]" : "text-[#f6465d]"}`}>{formatCurrency(s.netProfit)}</p>
          <span className="text-xs text-[#848e9c]">Chi phí: <span className="font-mono">{formatCurrency(s.expensesMonth)}</span></span>
        </div>

        {/* All time */}
        <KPICard
          label="Tổng doanh thu all-time" value={formatCurrency(s.revenueAllTime)}
          sub="Từ khi bắt đầu" icon={DollarSign}
          bg="bg-[#f0b90b]/10" iconBg="bg-[#f0b90b]" valueColor="text-[#fcd535]" border="border-[#f0b90b]/20"
        />

        {/* Textlink active */}
        <div className="bg-[#5b8def]/10 border border-[#5b8def]/20 rounded-xl p-4 card-hover">
          <div className="flex items-start justify-between mb-2">
            <p className="text-xs text-[#848e9c]">Textlink đang active</p>
            <div className="w-7 h-7 bg-[#5b8def] rounded-md flex items-center justify-center flex-shrink-0">
              <Link2 size={13} className="text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#5b8def] mb-1">{s.activeTextlinks}</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-[#2b3139] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#5b8def] rounded-full transition-all"
                style={{ width: s.totalSlots > 0 ? `${Math.min((s.occupiedCount / s.totalSlots) * 100, 100)}%` : "0%" }}
              />
            </div>
            <span className="text-xs text-[#848e9c]">{s.occupiedCount}/{s.totalSlots} slot</span>
          </div>
        </div>

        {/* Chưa thu */}
        <KPICard
          label="Chưa thu tiền" value={formatCurrency(s.unpaidTotal)}
          sub={`${s.unpaidOrders.length} đơn debt/unpaid`} icon={Wallet}
          bg="bg-[#f6465d]/10" iconBg="bg-[#f6465d]" valueColor="text-[#f6465d]" border="border-[#f6465d]/20"
        />

        {/* Tổng website */}
        <KPICard
          label="Tổng website" value={`${s.totalWebsites}`}
          sub={`${s.emptySlots.length} website còn slot trống`} icon={Globe}
          bg="bg-[#fcd535]/10" iconBg="bg-[#fcd535]" valueColor="text-[#fcd535]" border="border-[#fcd535]/20"
        />
      </div>

      {/* ── Chart + Top websites ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 bg-[#181a20] border border-[#2b3139] rounded-xl p-5 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#eaecef]">Doanh thu & Chi phí 6 tháng</h2>
              <p className="text-xs text-[#848e9c] mt-0.5">Chỉ tính đơn đã thanh toán</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#848e9c]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#0ecb81] inline-block" />Doanh thu</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#f6465d] inline-block" />Chi phí</span>
            </div>
          </div>
          <RevenueChart data={s.chartData} />
        </div>

        <SectionCard title="Top website tháng này" link="/websites">
          {s.topWebsites.length === 0 ? <EmptyState icon={Globe} text="Chưa có dữ liệu" /> : (
            <div className="space-y-3">
              {s.topWebsites.map((w: any, i: number) => {
                const maxRev = s.topWebsites[0]?.revenue ?? 1
                const pct = maxRev > 0 ? (w.revenue / maxRev) * 100 : 0
                return (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-[#eaecef] truncate max-w-[130px]">{w.domain}</span>
                      <span className="text-xs font-semibold text-[#0ecb81] font-mono">{formatCurrency(w.revenue)}</span>
                    </div>
                    <div className="h-1.5 bg-[#2b3139] rounded-full overflow-hidden">
                      <div className="h-full bg-[#0ecb81] rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── Đơn chưa thu + Top khách ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <SectionCard title="Đơn chưa thu tiền" link="/orders?status=unpaid">
          {s.unpaidOrders.length === 0 ? <EmptyState icon={ShoppingCart} text="Không có đơn nào chưa thu" /> : (
            <div className="space-y-0">
              {s.unpaidOrders.map((order: any) => {
                const total = calcOrderTotal(order.orderItems, order.discount ?? 0)
                const totalLinks = order.orderItems.reduce((sum: number, i: any) => sum + (i.entries?.length ?? 1), 0)
                return (
                  <div key={order.id} className="flex items-center justify-between py-2.5 border-b border-[#2b3139] last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#eaecef] truncate">{order.customer.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-[#848e9c]">{totalLinks} link{totalLinks > 1 ? 's' : ''}</span>
                        <span className="inline-flex items-center px-1.5 py-0.5 bg-[#2b3139] rounded text-[10px] text-[#848e9c]">
                          {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#f6465d] font-mono">{formatCurrency(total)}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${order.paymentStatus === "DEBT" ? "bg-[#f6465d]/10 text-[#f6465d]" : "bg-[#f0b90b]/10 text-[#f0b90b]"}`}>
                        {order.paymentStatus === "DEBT" ? "Nợ" : "Chưa TT"}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Top khách hàng tháng này" link="/customers">
          {s.topCustomers.length === 0 ? <EmptyState icon={Users} text="Chưa có dữ liệu" /> : (
            <div className="space-y-0">
              {s.topCustomers.map((c: any, i: number) => {
                const maxRev = s.topCustomers[0]?.revenue ?? 1
                const pct = maxRev > 0 ? (c.revenue / maxRev) * 100 : 0
                return (
                  <div key={i} className="py-2.5 border-b border-[#2b3139] last:border-0">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold w-4 ${i === 0 ? "text-[#fcd535]" : "text-[#848e9c]"}`}>#{i + 1}</span>
                        <span className="text-xs font-semibold text-[#eaecef]">{c.name}</span>
                      </div>
                      <span className="text-xs font-semibold text-[#0ecb81] font-mono">{formatCurrency(c.revenue)}</span>
                    </div>
                    <div className="h-1.5 bg-[#2b3139] rounded-full overflow-hidden ml-6">
                      <div className="h-full bg-[#0ecb81] rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── Website mới + Slot trống ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <SectionCard title="Website mới mua gần đây" link="/websites">
          {s.recentWebsites.length === 0 ? <EmptyState icon={Globe} text="Chưa có website nào" /> : (
            <div className="space-y-0">
              {s.recentWebsites.map((w: any) => (
                <div key={w.id} className="flex items-center justify-between py-2.5 border-b border-[#2b3139] last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#eaecef] truncate">{w.domain}</p>
                    <p className="text-xs text-[#848e9c] mt-0.5">DR {w.dr} · {Number(w.traffic ?? 0).toLocaleString()} traffic</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-[#fcd535] font-mono">{formatCurrency(w.buyPrice)}</p>
                    <span className="inline-flex items-center px-1.5 py-0.5 bg-[#2b3139] rounded text-[10px] text-[#848e9c] mt-0.5">
                      {new Date(w.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Slot trống chưa bán" link="/websites">
          {s.emptySlots.length === 0 ? (
            <div className="text-center py-7">
              <Link2 size={22} className="text-[#0ecb81] mx-auto mb-2" />
              <p className="text-xs text-[#0ecb81] font-medium">Tất cả slot đã được lấp đầy</p>
            </div>
          ) : (
            <div className="space-y-0">
              {s.emptySlots.map((w: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-[#2b3139] last:border-0">
                  <p className="text-xs font-semibold text-[#eaecef]">{w.domain}</p>
                  <div className="flex gap-1">
                    {w.types.map((t: string) => (
                      <span key={t} className="text-xs bg-[#2b3139] text-[#b7bdc6] px-2 py-0.5 rounded font-medium">
                        {formatType(t as any)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

    </div>
  )
}