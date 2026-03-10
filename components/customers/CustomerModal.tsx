"use client"

import { useState, useEffect } from "react"
import { X, User } from "lucide-react"

type Customer = {
  id: string; telegramUsername: string; name: string | null; note: string | null
}

export default function CustomerModal({ customer, onClose }: { customer: Customer | null; onClose: () => void }) {
  const [formData, setFormData] = useState({ telegramUsername: "", name: "", note: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (customer) setFormData({ telegramUsername: customer.telegramUsername, name: customer.name || "", note: customer.note || "" })
  }, [customer])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch(customer ? `/api/customers/${customer.id}` : "/api/customers", {
        method: customer ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        onClose()
      } else {
        const data = await res.json()
        setError(data.error || "Có lỗi xảy ra")
      }
    } catch (err) {
      console.error(err)
      setError("Không thể kết nối đến server")
    }
    finally { setLoading(false) }
  }

  const inputClass = "w-full bg-[#0b0e11] border border-[#2b3139] rounded-lg px-3 py-2 text-sm text-[#eaecef] placeholder-[#474d57] focus:outline-none focus:border-[#fcd535]/50 transition-colors"

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-[#181a20] border border-[#2b3139] rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2b3139]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#fcd535]/10 rounded-lg flex items-center justify-center">
              <User size={14} className="text-[#fcd535]" />
            </div>
            <h2 className="text-sm font-bold text-[#eaecef]">
              {customer ? "Chỉnh sửa khách hàng" : "Thêm khách hàng"}
            </h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-[#848e9c] hover:text-[#eaecef] hover:bg-[#2b3139] rounded-lg transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-[#f6465d]/10 border border-[#f6465d]/20 rounded-lg p-3 text-xs text-[#f6465d]">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-[#848e9c] mb-1.5">
              Telegram Username <span className="text-[#f6465d]">*</span>
            </label>
            <input type="text" value={formData.telegramUsername} required placeholder="@username"
              onChange={e => setFormData({ ...formData, telegramUsername: e.target.value })}
              className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#848e9c] mb-1.5">Tên khách hàng</label>
            <input type="text" value={formData.name} placeholder="Tên đầy đủ (tùy chọn)"
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#848e9c] mb-1.5">Ghi chú</label>
            <textarea value={formData.note} rows={3} placeholder="Ghi chú về khách hàng..."
              onChange={e => setFormData({ ...formData, note: e.target.value })}
              className={`${inputClass} resize-none`} />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 text-xs text-[#848e9c] bg-[#1e2329] border border-[#2b3139] px-4 py-2 rounded-lg hover:border-[#474d57] hover:text-[#eaecef] transition-colors font-medium">
              Hủy
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 text-xs text-[#0b0e11] bg-gradient-to-r from-[#fcd535] to-[#f0b90b] px-4 py-2 rounded-lg font-bold disabled:opacity-50 hover:from-[#f0b90b] hover:to-[#fcd535] transition-all">
              {loading ? (
                <span className="flex items-center justify-center gap-1.5">
                  <span className="w-3 h-3 border-2 border-[#0b0e11]/30 border-t-[#0b0e11] rounded-full animate-spin" />
                  Đang lưu...
                </span>
              ) : customer ? "Cập nhật" : "Thêm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}