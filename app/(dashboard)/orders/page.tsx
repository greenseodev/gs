"use client"

import { useEffect, useState } from "react"
import { Plus, Eye, ShoppingCart, DollarSign, AlertCircle, TrendingUp } from "lucide-react"
import { formatCurrency, formatDate, formatPaymentStatus, calcOrderTotal } from "@/lib/formatters"
import { toast } from "@/lib/toast"
import Link from "next/link"
import Select from "@/components/ui/Select"

type Order = {
  id: string
  paymentStatus: string
  discount: number
  createdAt: string
  customer: { id: string; telegramUsername: string; name: string | null }
  orderItems: Array<{
    id: string
    unitPrice: number
    website: { domain: string }
    entries: Array<{ id: string }>
  }>
}

// STATUS object removed - using formatPaymentStatus from formatters

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("ALL")

  useEffect(() => { fetchOrders() }, [filterStatus])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const url = filterStatus === "ALL" ? "/api/orders" : `/api/orders?paymentStatus=${filterStatus}`
      const data = await (await fetch(url)).json()
      // Check if the response is an array, otherwise set empty array
      setOrders(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
      setOrders([])
    }
    finally { setLoading(false) }
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

  const calculateOrderTotal = (order: Order) => {
    return calcOrderTotal(order.orderItems, order.discount)
  }

  const paidRevenue = orders.filter(o => o.paymentStatus === "PAID")
    .reduce((s, o) => s + calculateOrderTotal(o), 0)
  const unpaidCount = orders.filter(o => ["UNPAID", "DEBT"].includes(o.paymentStatus)).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#eaecef]">Quản lý Đơn hàng</h1>
          <p className="text-xs text-[#848e9c] mt-0.5">{orders.length} đơn hàng</p>
        </div>
        <Link
          href="/orders/create"
          className="flex items-center gap-1.5 text-xs text-[#0b0e11] bg-gradient-to-r from-[#fcd535] to-[#f0b90b] px-3 py-1.5 rounded-lg font-medium hover:from-[#f0b90b] hover:to-[#fcd535] transition-all glow-primary"
        >
          <Plus size={13} /> Tạo đơn hàng
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Tổng đơn", value: orders.length, icon: ShoppingCart, color: "text-[#fcd535]", iconBg: "bg-[#fcd535]/10" },
          { label: "Đã thanh toán", value: orders.filter(o => o.paymentStatus === "PAID").length, icon: TrendingUp, color: "text-[#0ecb81]", iconBg: "bg-[#0ecb81]/10" },
          { label: "Chưa thu tiền", value: unpaidCount, icon: AlertCircle, color: "text-[#f6465d]", iconBg: "bg-[#f6465d]/10" },
          { label: "Doanh thu (paid)", value: formatCurrency(paidRevenue), icon: DollarSign, color: "text-[#5b8def]", iconBg: "bg-[#5b8def]/10" },
        ].map((s, i) => (
          <div key={i} className="bg-[#181a20] border border-[#2b3139] rounded-lg px-4 py-3 flex items-center gap-3">
            <div className={`w-7 h-7 ${s.iconBg} rounded-md flex items-center justify-center flex-shrink-0`}>
              <s.icon size={14} className={s.color} />
            </div>
            <div>
              <p className="text-xs text-[#848e9c]">{s.label}</p>
              <p className={`text-sm font-bold ${s.color} ${s.label === "Doanh thu (paid)" ? "font-mono" : ""}`}>{typeof s.value === "number" && s.label !== "Doanh thu (paid)" ? s.value : s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5">
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
                  {["Mã đơn", "Khách hàng", "Textlinks", "Tổng tiền", "Trạng thái", "Ngày tạo", ""].map((h, i) => (
                    <th key={i} className={`px-5 py-3 text-xs font-medium text-[#848e9c] uppercase tracking-wide ${i === 6 ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(order => {
                  const total = calculateOrderTotal(order)
                  const totalLinks = order.orderItems.reduce((s, i) => s + i.entries.length, 0)
                  const cfg = formatPaymentStatus(order.paymentStatus as any)
                  return (
                    <tr key={order.id} className="border-b border-[#2b3139] last:border-0 hover:bg-[#1e2329] transition-colors group">
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-mono text-[#848e9c]">#{order.id.slice(0, 8)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-xs font-semibold text-[#eaecef]">{order.customer.name || "—"}</p>
                        <p className="text-xs text-[#848e9c]">{order.customer.telegramUsername}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs bg-[#2b3139] text-[#b7bdc6] px-2 py-0.5 rounded font-medium">
                          {totalLinks} link{totalLinks > 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-bold text-[#fcd535] font-mono">{formatCurrency(total)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Select
                          value={order.paymentStatus}
                          onChange={(value) => handleStatusUpdate(order.id, value)}
                          options={[
                            {
                              value: "ORDERED",
                              label: formatPaymentStatus("ORDERED").label,
                              color: formatPaymentStatus("ORDERED").text,
                              bg: formatPaymentStatus("ORDERED").bg,
                              border: formatPaymentStatus("ORDERED").border,
                            },
                            {
                              value: "PAID",
                              label: formatPaymentStatus("PAID").label,
                              color: formatPaymentStatus("PAID").text,
                              bg: formatPaymentStatus("PAID").bg,
                              border: formatPaymentStatus("PAID").border,
                            },
                            {
                              value: "UNPAID",
                              label: formatPaymentStatus("UNPAID").label,
                              color: formatPaymentStatus("UNPAID").text,
                              bg: formatPaymentStatus("UNPAID").bg,
                              border: formatPaymentStatus("UNPAID").border,
                            },
                            {
                              value: "DEBT",
                              label: formatPaymentStatus("DEBT").label,
                              color: formatPaymentStatus("DEBT").text,
                              bg: formatPaymentStatus("DEBT").bg,
                              border: formatPaymentStatus("DEBT").border,
                            },
                          ]}
                          className="min-w-35"
                        />
                      </td>
                      <td className="px-5 py-3.5 text-xs text-[#848e9c]">{formatDate(order.createdAt)}</td>
                      <td className="px-5 py-3.5 text-right">
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