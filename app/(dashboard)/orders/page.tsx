"use client"

import { useEffect, useState, useRef } from "react"
import { Plus, Eye, ShoppingCart, DollarSign, AlertCircle, TrendingUp, ChevronLeft, ChevronRight, ChevronDown, Wallet } from "lucide-react"
import { formatCurrency, formatPaymentStatus, calcOrderTotal } from "@/lib/formatters"
import { toast } from "@/lib/toast"
import Link from "next/link"
import Select from "@/components/ui/Select"
import { DateBadge } from "@/components/ui/DateBadge"

type OrderItem = {
  id: string
  unitPrice: number
  startDate: string
  endDate: string
  website: { domain: string }
  entries: Array<{ id: string }>
}

type Order = {
  id: string
  paymentStatus: string
  discount: number
  createdAt: string
  customer: { id: string; telegramUsername: string; name: string | null }
  orderItems: OrderItem[]
}

const MONTHS = ["Th1","Th2","Th3","Th4","Th5","Th6","Th7","Th8","Th9","Th10","Th11","Th12"]

function MonthPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear())
  const ref = useRef<HTMLDivElement>(null)

  const selectedYear = value ? parseInt(value.split("-")[0]) : null
  const selectedMonth = value ? parseInt(value.split("-")[1]) - 1 : null

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const select = (monthIdx: number) => {
    onChange(`${pickerYear}-${String(monthIdx + 1).padStart(2, "0")}`)
    setOpen(false)
  }

  const displayLabel = value ? `Tháng ${selectedMonth! + 1}, ${selectedYear}` : "Tất cả tháng"

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 bg-[#0b0e11] border rounded-lg px-3 py-1.5 text-xs transition-colors min-w-[150px] ${
          open ? "border-[#fcd535]/50 text-[#eaecef]" : "border-[#2b3139] text-[#848e9c] hover:border-[#474d57]"
        }`}>
        <span className="flex-1 text-left">{displayLabel}</span>
        {value && (
          <span onClick={e => { e.stopPropagation(); onChange("") }}
            className="text-[#474d57] hover:text-[#f6465d] transition-colors text-xs font-bold leading-none">×</span>
        )}
        <ChevronDown size={11} className={`flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 right-0 bg-[#1e2329] border border-[#2b3139] rounded-xl shadow-2xl z-50 w-56 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#2b3139]">
            <button type="button" onClick={() => setPickerYear(y => y - 1)}
              className="w-6 h-6 flex items-center justify-center text-[#848e9c] hover:text-[#eaecef] hover:bg-[#2b3139] rounded transition-colors">
              <ChevronLeft size={12} />
            </button>
            <span className="text-sm font-bold text-[#eaecef]">{pickerYear}</span>
            <button type="button" onClick={() => setPickerYear(y => y + 1)}
              className="w-6 h-6 flex items-center justify-center text-[#848e9c] hover:text-[#eaecef] hover:bg-[#2b3139] rounded transition-colors">
              <ChevronRight size={12} />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1 p-3">
            {MONTHS.map((m, i) => {
              const isSelected = selectedYear === pickerYear && selectedMonth === i
              const isCurrentMonth = new Date().getFullYear() === pickerYear && new Date().getMonth() === i
              return (
                <button key={i} type="button" onClick={() => select(i)}
                  className={`py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-[#fcd535] text-[#0b0e11] font-bold"
                      : isCurrentMonth
                      ? "bg-[#fcd535]/10 text-[#fcd535] border border-[#fcd535]/20"
                      : "text-[#848e9c] hover:bg-[#2b3139] hover:text-[#eaecef]"
                  }`}>
                  {m}
                </button>
              )
            })}
          </div>
          <div className="flex gap-2 px-3 pb-3">
            <button type="button" onClick={() => { const n = new Date(); select(n.getMonth()) }}
              className="flex-1 text-xs text-[#fcd535] bg-[#fcd535]/5 border border-[#fcd535]/20 py-1.5 rounded-lg hover:bg-[#fcd535]/10 transition-colors font-medium">
              Tháng này
            </button>
            {value && (
              <button type="button" onClick={() => { onChange(""); setOpen(false) }}
                className="flex-1 text-xs text-[#848e9c] bg-[#2b3139] py-1.5 rounded-lg hover:text-[#eaecef] transition-colors font-medium">
                Xóa lọc
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ExpiryBadge({ orderItems }: { orderItems: OrderItem[] }) {
  const now = new Date()
  const soonThreshold = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  // Find earliest endDate among all items
  const earliest = orderItems.reduce<Date | null>((min, item) => {
    const d = new Date(item.endDate)
    return min === null || d < min ? d : min
  }, null)

  if (!earliest) return null

  const isExpired = earliest < now
  const isSoon = !isExpired && earliest <= soonThreshold

  return (
    <div className="flex items-center gap-1.5">
      <DateBadge date={earliest.toISOString()} />
      {isExpired && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#f6465d]/10 text-[#f6465d] border border-[#f6465d]/20">Hết hạn</span>
      )}
      {isSoon && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#f0b90b]/10 text-[#f0b90b] border border-[#f0b90b]/20">Sắp HH</span>
      )}
    </div>
  )
}

function WebsiteCell({ orderItems }: { orderItems: OrderItem[] }) {
  const domains = [...new Set(orderItems.map(i => i.website.domain))]
  const first = domains[0]
  const rest = domains.length - 1
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <span className="text-xs font-medium text-[#b7bdc6] truncate max-w-[120px]">{first}</span>
      {rest > 0 && (
        <span className="text-[10px] bg-[#2b3139] text-[#848e9c] px-1.5 py-0.5 rounded font-medium">+{rest}</span>
      )}
    </div>
  )
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("ALL")
  const [filterMonth, setFilterMonth] = useState("")

  useEffect(() => { fetchOrders() }, [filterStatus, filterMonth])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams()
      if (filterStatus !== "ALL") p.append("paymentStatus", filterStatus)
      if (filterMonth) p.append("month", filterMonth)
      const url = `/api/orders${p.toString() ? `?${p}` : ""}`
      const data = await (await fetch(url)).json()
      setOrders(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
      setOrders([])
    } finally { setLoading(false) }
  }

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: newStatus }),
      })
      if (res.ok) {
        toast.success("Đã cập nhật trạng thái thanh toán")
        fetchOrders()
      } else {
        toast.error("Không thể cập nhật trạng thái")
      }
    } catch (e) {
      console.error(e)
      toast.error("Có lỗi xảy ra khi cập nhật trạng thái")
    }
  }

  const calcTotal = (order: Order) => calcOrderTotal(order.orderItems, order.discount)

  const paidOrders = orders.filter(o => o.paymentStatus === "PAID")
  const unpaidOrders = orders.filter(o => ["UNPAID", "DEBT"].includes(o.paymentStatus))
  const paidRevenue = paidOrders.reduce((s, o) => s + calcTotal(o), 0)
  const unpaidTotal = unpaidOrders.reduce((s, o) => s + calcTotal(o), 0)

  const now = new Date()
  const expiringCount = orders.filter(o =>
    o.orderItems.some(item => {
      const end = new Date(item.endDate)
      return end >= now && end <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    })
  ).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#eaecef]">Quản lý Đơn hàng</h1>
          <p className="text-xs text-[#848e9c] mt-0.5">{orders.length} đơn hàng{filterMonth ? ` · Tháng ${filterMonth.split("-")[1]}/${filterMonth.split("-")[0]}` : ""}</p>
        </div>
        <Link href="/orders/create"
          className="flex items-center gap-1.5 text-xs text-[#0b0e11] bg-gradient-to-r from-[#fcd535] to-[#f0b90b] px-3 py-1.5 rounded-lg font-medium hover:from-[#f0b90b] hover:to-[#fcd535] transition-all glow-primary">
          <Plus size={13} /> Tạo đơn hàng
        </Link>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#181a20] border border-[#2b3139] rounded-lg px-4 py-3 flex items-center gap-3">
          <div className="w-7 h-7 bg-[#fcd535]/10 rounded-md flex items-center justify-center flex-shrink-0">
            <ShoppingCart size={14} className="text-[#fcd535]" />
          </div>
          <div>
            <p className="text-xs text-[#848e9c]">Tổng đơn</p>
            <p className="text-sm font-bold text-[#fcd535]">{orders.length}</p>
          </div>
        </div>

        <div className="bg-[#181a20] border border-[#2b3139] rounded-lg px-4 py-3 flex items-center gap-3">
          <div className="w-7 h-7 bg-[#0ecb81]/10 rounded-md flex items-center justify-center flex-shrink-0">
            <DollarSign size={14} className="text-[#0ecb81]" />
          </div>
          <div>
            <p className="text-xs text-[#848e9c]">Đã thu ({paidOrders.length} đơn)</p>
            <p className="text-sm font-bold text-[#0ecb81] font-mono">{formatCurrency(paidRevenue)}</p>
          </div>
        </div>

        <div className="bg-[#181a20] border border-[#2b3139] rounded-lg px-4 py-3 flex items-center gap-3">
          <div className="w-7 h-7 bg-[#f6465d]/10 rounded-md flex items-center justify-center flex-shrink-0">
            <Wallet size={14} className="text-[#f6465d]" />
          </div>
          <div>
            <p className="text-xs text-[#848e9c]">Chưa thu ({unpaidOrders.length} đơn)</p>
            <p className="text-sm font-bold text-[#f6465d] font-mono">{formatCurrency(unpaidTotal)}</p>
          </div>
        </div>

        <div className={`bg-[#181a20] border rounded-lg px-4 py-3 flex items-center gap-3 ${expiringCount > 0 ? "border-[#f0b90b]/30" : "border-[#2b3139]"}`}>
          <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${expiringCount > 0 ? "bg-[#f0b90b]/10" : "bg-[#5b8def]/10"}`}>
            <AlertCircle size={14} className={expiringCount > 0 ? "text-[#f0b90b]" : "text-[#5b8def]"} />
          </div>
          <div>
            <p className="text-xs text-[#848e9c]">Sắp hết hạn (7 ngày)</p>
            <p className={`text-sm font-bold ${expiringCount > 0 ? "text-[#f0b90b]" : "text-[#5b8def]"}`}>{expiringCount} đơn</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {[
            { key: "ALL", label: "Tất cả" },
            { key: "ORDERED", label: formatPaymentStatus("ORDERED").label },
            { key: "PAID", label: formatPaymentStatus("PAID").label },
            { key: "UNPAID", label: formatPaymentStatus("UNPAID").label },
            { key: "DEBT", label: formatPaymentStatus("DEBT").label },
          ].map(f => (
            <button key={f.key} onClick={() => setFilterStatus(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === f.key
                  ? "bg-[#fcd535] text-[#0b0e11]"
                  : "bg-[#181a20] border border-[#2b3139] text-[#848e9c] hover:text-[#eaecef] hover:border-[#474d57]"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
        <MonthPicker value={filterMonth} onChange={setFilterMonth} />
      </div>

      {/* Table */}
      <div className="bg-[#181a20] border border-[#2b3139] rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-5 h-5 border-2 border-[#fcd535] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart size={28} className="text-[#474d57] mx-auto mb-3" />
            <p className="text-sm text-[#848e9c]">Không có đơn hàng nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2b3139]">
                  {["Mã đơn", "Khách hàng", "Textlinks", "Tổng tiền", "Trạng thái", "Ngày bắt đầu", "Hết hạn", ""].map((h, i) => (
                    <th key={i} className={`px-4 py-3 text-xs font-medium text-[#848e9c] uppercase tracking-wide ${i === 7 ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(order => {
                  const total = calcTotal(order)
                  const totalLinks = order.orderItems.reduce((s, i) => s + i.entries.length, 0)
                  return (
                    <tr key={order.id} className="border-b border-[#2b3139] last:border-0 hover:bg-[#1e2329] transition-colors group whitespace-nowrap">
                      {/* Mã đơn */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-mono text-[#848e9c]">#{order.id.slice(0, 8)}</span>
                      </td>

                      {/* Khách hàng */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-semibold text-[#eaecef]">{order.customer.name || "—"}</span>
                      </td>

                      {/* Textlinks */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs bg-[#2b3139] text-[#b7bdc6] px-2 py-0.5 rounded font-medium">
                          {totalLinks} link{totalLinks !== 1 ? "s" : ""}
                        </span>
                      </td>

                      {/* Tổng tiền */}
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-bold text-[#fcd535] font-mono">{formatCurrency(total)}</span>
                      </td>

                      {/* Trạng thái */}
                      <td className="px-4 py-3.5">
                        <Select
                          value={order.paymentStatus}
                          onChange={(value) => handleStatusUpdate(order.id, value)}
                          options={["ORDERED", "PAID", "UNPAID", "DEBT"].map(s => ({
                            value: s,
                            label: formatPaymentStatus(s as any).label,
                            color: formatPaymentStatus(s as any).text,
                            bg: formatPaymentStatus(s as any).bg,
                            border: formatPaymentStatus(s as any).border,
                          }))}
                          className="min-w-[130px]"
                        />
                      </td>

                      {/* Ngày bắt đầu */}
                      <td className="px-4 py-3.5">
                        <DateBadge date={order.orderItems[0]?.startDate ?? order.createdAt} />
                      </td>

                      {/* Hết hạn */}
                      <td className="px-4 py-3.5">
                        <ExpiryBadge orderItems={order.orderItems} />
                      </td>

                      {/* Chi tiết */}
                      <td className="px-4 py-3.5 text-right">
                        <Link href={`/orders/${order.id}`}
                          className="inline-flex items-center gap-1 text-xs text-[#5b8def] bg-[#5b8def]/10 border border-[#5b8def]/20 px-2.5 py-1 rounded-lg hover:bg-[#5b8def]/20 transition-colors opacity-0 group-hover:opacity-100">
                          <Eye size={11} /> Chi tiết
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
