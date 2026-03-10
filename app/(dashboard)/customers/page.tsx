"use client"

import { useEffect, useState } from "react"
import { Plus, Edit, Trash2, User, Users, TrendingUp, ShoppingCart, Search } from "lucide-react"
import { formatCurrency } from "@/lib/formatters"
import { toast } from "@/lib/toast"
import CustomerModal from "@/components/customers/CustomerModal"
import Link from "next/link"

type Customer = {
  id: string; telegramUsername: string; name: string | null
  note: string | null; createdAt: string; totalOrders: number; totalRevenue: number
}

function Avatar({ name, username }: { name: string | null; username: string }) {
  const letter = (name || username)[0].toUpperCase()
  const colors = ["text-[#fcd535] bg-[#fcd535]/10", "text-[#0ecb81] bg-[#0ecb81]/10", "text-[#5b8def] bg-[#5b8def]/10", "text-[#f0b90b] bg-[#f0b90b]/10"]
  const idx = username.charCodeAt(0) % colors.length
  return (
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${colors[idx]}`}>
      {letter}
    </div>
  )
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  useEffect(() => { fetchCustomers() }, [])

  const fetchCustomers = async () => {
    try {
      const data = await (await fetch("/api/customers")).json()
      setCustomers(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
      setCustomers([])
    }
    finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    // Show confirmation using native confirm for now - can be replaced with custom modal later
    if (!window.confirm("Bạn có chắc chắn muốn xóa khách hàng này?")) return
    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Đã xóa khách hàng thành công")
        fetchCustomers()
      } else {
        toast.error("Không thể xóa khách hàng")
      }
    } catch (e) {
      console.error(e)
      toast.error("Có lỗi xảy ra khi xóa khách hàng")
    }
  }

  const filtered = customers.filter(c =>
    (c.name || "").toLowerCase().includes(search.toLowerCase()) ||
    c.telegramUsername.toLowerCase().includes(search.toLowerCase())
  )

  const totalRevenue = customers.reduce((s, c) => s + c.totalRevenue, 0)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-5 h-5 border-2 border-[#fcd535] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#eaecef]">Quản lý Khách hàng</h1>
          <p className="text-xs text-[#848e9c] mt-0.5">{customers.length} khách hàng</p>
        </div>
        <button onClick={() => { setSelectedCustomer(null); setModalOpen(true) }}
          className="flex items-center gap-1.5 text-xs text-[#0b0e11] bg-gradient-to-r from-[#fcd535] to-[#f0b90b] px-3 py-1.5 rounded-lg font-medium hover:from-[#f0b90b] hover:to-[#fcd535] transition-all glow-primary">
          <Plus size={13} /> Thêm khách hàng
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Tổng khách hàng", value: customers.length, icon: Users, color: "text-[#fcd535]", bg: "bg-[#fcd535]/10" },
          { label: "Tổng đơn hàng", value: customers.reduce((s, c) => s + c.totalOrders, 0), icon: ShoppingCart, color: "text-[#5b8def]", bg: "bg-[#5b8def]/10" },
          { label: "Tổng doanh thu", value: formatCurrency(totalRevenue), icon: TrendingUp, color: "text-[#0ecb81]", bg: "bg-[#0ecb81]/10" },
        ].map((s, i) => (
          <div key={i} className="bg-[#181a20] border border-[#2b3139] rounded-lg px-4 py-3 flex items-center gap-3">
            <div className={`w-7 h-7 ${s.bg} rounded-md flex items-center justify-center flex-shrink-0`}>
              <s.icon size={14} className={s.color} />
            </div>
            <div>
              <p className="text-xs text-[#848e9c]">{s.label}</p>
              <p className={`text-sm font-bold ${s.color} ${s.label === "Tổng doanh thu" ? "font-mono" : ""}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#848e9c]" />
        <input type="text" placeholder="Tìm tên hoặc Telegram..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-[#181a20] border border-[#2b3139] rounded-lg pl-9 pr-4 py-2 text-sm text-[#eaecef] placeholder-[#848e9c] focus:outline-none focus:border-[#fcd535]/50 transition-colors" />
      </div>

      {/* Table */}
      <div className="bg-[#181a20] border border-[#2b3139] rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users size={28} className="text-[#474d57] mx-auto mb-3" />
            <p className="text-sm text-[#848e9c]">{search ? `Không tìm thấy "${search}"` : "Chưa có khách hàng nào"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2b3139]">
                  {["Khách hàng", "Telegram", "Đơn hàng", "Doanh thu", "Ghi chú", ""].map((h, i) => (
                    <th key={i} className={`px-5 py-3 text-xs font-medium text-[#848e9c] uppercase tracking-wide ${i === 5 ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(customer => (
                  <tr key={customer.id} className="border-b border-[#2b3139] last:border-0 hover:bg-[#1e2329] transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={customer.name} username={customer.telegramUsername} />
                        <div>
                          <p className="text-sm font-semibold text-[#eaecef]">{customer.name || "—"}</p>
                          <p className="text-xs text-[#848e9c]">#{customer.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-[#b7bdc6] bg-[#2b3139] px-2 py-1 rounded font-medium">{customer.telegramUsername}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs bg-[#5b8def]/10 text-[#5b8def] border border-[#5b8def]/20 px-2 py-0.5 rounded font-semibold">
                        {customer.totalOrders} đơn
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-bold text-[#fcd535] font-mono">{formatCurrency(customer.totalRevenue)}</span>
                    </td>
                    <td className="px-5 py-4 max-w-[200px]">
                      <span className="text-xs text-[#848e9c] truncate block">{customer.note || "—"}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setSelectedCustomer(customer); setModalOpen(true) }}
                          className="flex items-center gap-1 text-xs text-[#5b8def] bg-[#5b8def]/10 border border-[#5b8def]/20 px-2.5 py-1 rounded-lg hover:bg-[#5b8def]/20 transition-colors font-medium">
                          <Edit size={11} /> Sửa
                        </button>
                        <button onClick={() => handleDelete(customer.id)}
                          className="flex items-center gap-1 text-xs text-[#f6465d] bg-[#f6465d]/10 border border-[#f6465d]/20 px-2.5 py-1 rounded-lg hover:bg-[#f6465d]/20 transition-colors font-medium">
                          <Trash2 size={11} /> Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <CustomerModal customer={selectedCustomer} onClose={() => { setModalOpen(false); setSelectedCustomer(null); fetchCustomers() }} />
      )}
    </div>
  )
}