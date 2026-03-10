"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, RefreshCw, Edit3, Trash2 } from "lucide-react"
import { formatCurrency, formatDate, formatPaymentStatus, calcOrderTotal } from "@/lib/formatters"
import { toast } from "@/lib/toast"
import Link from "next/link"
import OrderItemCard from "@/components/orders/OrderItemCard"
import EditEntriesModal from "@/components/orders/EditEntriesModal"

type TextlinkEntry = {
  id: string
  anchorText: string
  targetUrl: string
  position: number
}

type Order = {
  id: string; paymentStatus: string; discount: number; createdAt: string
  customer: { id: string; telegramUsername: string; name: string | null }
  orderItems: Array<{
    id: string; type: string; duration: string; unitPrice: number
    startDate: string; endDate: string; status: string
    website: { id: string; domain: string; dr: number; traffic: number }
    entries: TextlinkEntry[]
  }>
}

// STATUS object removed - using formatPaymentStatus from formatters

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string[]>([])
  const [editModal, setEditModal] = useState<{ itemId: string; entries: TextlinkEntry[] } | null>(null)

  useEffect(() => { if (params.id) fetchOrder() }, [params.id])

  const fetchOrder = async () => {
    try {
      const data = await (await fetch(`/api/orders/${params.id}`)).json()
      // Only set order if data has an id (valid order object)
      if (data && data.id) setOrder(data)
    }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleRenew = async () => {
    if (!selected.length) {
      toast.warning("Vui lòng chọn ít nhất 1 textlink để gia hạn")
      return
    }
    try {
      const res = await fetch(`/api/orders/${params.id}/renew`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds: selected }),
      })
      if (res.ok) {
        toast.success(`Đã gia hạn ${selected.length} textlink thành công`)
        router.push("/orders")
      } else {
        toast.error("Không thể gia hạn")
      }
    } catch (e) {
      console.error(e)
      toast.error("Có lỗi xảy ra khi gia hạn")
    }
  }

  const toggle = (id: string) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  const toggleAll = () => setSelected(p => p.length === order!.orderItems.length ? [] : order!.orderItems.map(i => i.id))

  const handleEditEntries = (itemId: string, entries: TextlinkEntry[]) => {
    setEditModal({ itemId, entries })
  }

  const handleDeleteOrder = async () => {
    if (!order) return
    if (order.paymentStatus === "PAID") {
      toast.error("Không thể xóa đơn hàng đã thanh toán")
      return
    }

    // Show confirmation using native confirm for now - can be replaced with custom modal later
    if (!window.confirm("Bạn có chắc chắn muốn xóa đơn hàng này?")) return

    try {
      const res = await fetch(`/api/orders/${params.id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Đã xóa đơn hàng thành công")
        router.push("/orders")
      } else {
        toast.error("Không thể xóa đơn hàng")
      }
    } catch (e) {
      console.error(e)
      toast.error("Có lỗi xảy ra khi xóa đơn hàng")
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-5 h-5 border-2 border-[#fcd535] border-t-transparent rounded-full animate-spin" /></div>
  if (!order) return <div className="text-[#848e9c] p-8">Không tìm thấy đơn hàng</div>

  const total = calcOrderTotal(order.orderItems, order.discount)
  const subtotal = calcOrderTotal(order.orderItems, 0)
  const discountAmount = subtotal - total
  const totalLinks = order.orderItems.reduce((s, i) => s + i.entries.length, 0)
  const cfg = formatPaymentStatus(order.paymentStatus as any)

  return (
    <>
      <EditEntriesModal
        isOpen={!!editModal}
        onClose={() => setEditModal(null)}
        itemId={editModal?.itemId || ""}
        orderId={order?.id || ""}
        entries={editModal?.entries || []}
        onSave={fetchOrder}
      />
      <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/orders" className="w-8 h-8 bg-[#181a20] border border-[#2b3139] rounded-lg flex items-center justify-center hover:border-[#474d57] transition-colors">
            <ArrowLeft size={15} className="text-[#848e9c]" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#eaecef]">Đơn #{order.id.slice(0, 8)}</h1>
            <p className="text-xs text-[#848e9c] mt-0.5">Tạo ngày {formatDate(order.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRenew} disabled={!selected.length}
            className="flex items-center gap-1.5 text-xs text-[#0b0e11] bg-gradient-to-r from-[#fcd535] to-[#f0b90b] px-3 py-1.5 rounded-lg font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:from-[#f0b90b] hover:to-[#fcd535] transition-all glow-primary">
            <RefreshCw size={12} /> Gia hạn {selected.length > 0 ? `(${selected.length})` : ""}
          </button>
          {order.paymentStatus !== "PAID" && (
            <button onClick={handleDeleteOrder}
              className="flex items-center gap-1.5 text-xs text-[#f6465d] bg-[#f6465d]/10 border border-[#f6465d]/20 px-3 py-1.5 rounded-lg font-medium hover:bg-[#f6465d]/20 transition-all">
              <Trash2 size={12} /> Xóa
            </button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Textlink list */}
        <div className="lg:col-span-2 bg-[#181a20] border border-[#2b3139] rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#2b3139] flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#eaecef]">Textlinks ({order.orderItems.length})</h2>
            <button onClick={toggleAll} className="text-xs text-[#848e9c] hover:text-[#fcd535] transition-colors">
              {selected.length === order.orderItems.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
            </button>
          </div>
          <div className="divide-y divide-[#2b3139]">
            {order.orderItems.map(item => (
              <OrderItemCard
                key={item.id}
                item={item}
                isSelected={selected.includes(item.id)}
                onToggle={toggle}
                onEditEntries={handleEditEntries}
              />
            ))}
          </div>
        </div>

        {/* Sidebar info */}
        <div className="space-y-3">
          <div className="bg-[#181a20] border border-[#2b3139] rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#eaecef]">Thông tin đơn hàng</h3>
            <div>
              <p className="text-xs text-[#848e9c] mb-1">Khách hàng</p>
              <p className="text-sm font-semibold text-[#eaecef]">{order.customer.name || "—"}</p>
              <p className="text-xs text-[#848e9c]">{order.customer.telegramUsername}</p>
            </div>
            <div className="border-t border-[#2b3139] pt-3">
              <p className="text-xs text-[#848e9c] mb-2">Trạng thái thanh toán</p>
              <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-lg border ${cfg?.bg} ${cfg?.text} ${cfg?.border}`}>
                {cfg?.label}
              </span>
            </div>
            <div className="border-t border-[#2b3139] pt-3">
              <p className="text-xs text-[#848e9c] mb-1">Số gói / Số links</p>
              <p className="text-sm font-semibold text-[#eaecef]">{order.orderItems.length} / {totalLinks}</p>
            </div>
            <div className="border-t border-[#2b3139] pt-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#848e9c]">Tạm tính</span>
                <span className="text-[#eaecef] font-medium font-mono">{formatCurrency(subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-[#848e9c]">Chiết khấu</span>
                  <span className="text-[#f6465d] font-medium font-mono">-{formatCurrency(discountAmount)} ({order.discount}%)</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-[#2b3139]">
                <span className="text-xs text-[#848e9c]">Tổng cộng</span>
                <p className="text-2xl font-bold text-[#fcd535] font-mono">{formatCurrency(total)}</p>
              </div>
            </div>
          </div>

          {selected.length > 0 && (
            <div className="bg-[#fcd535]/5 border border-[#fcd535]/20 rounded-xl p-4">
              <p className="text-xs font-semibold text-[#fcd535] mb-1">Đã chọn {selected.length} textlink</p>
              <p className="text-xs text-[#848e9c]">Nhấn "Gia hạn" để tạo đơn mới với giá hiện tại</p>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  )
}