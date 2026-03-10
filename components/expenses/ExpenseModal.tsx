"use client"

import { useState, useEffect } from "react"
import { X, DollarSign } from "lucide-react"

type Expense = { id: string; category: string; amount: number; note: string | null; date: string }

const CATEGORIES: Record<string, { label: string; color: string; bg: string }> = {
  WEBSITE_PURCHASE: { label: "Mua website",     color: "text-[#fcd535]", bg: "bg-[#fcd535]/10" },
  VPS:              { label: "VPS/Hosting",      color: "text-[#5b8def]", bg: "bg-[#5b8def]/10" },
  DOMAIN_RENEWAL:   { label: "Gia hạn domain",  color: "text-[#f0b90b]", bg: "bg-[#f0b90b]/10" },
  PARTNER_SHARE:    { label: "Chia sẻ đối tác", color: "text-[#0ecb81]", bg: "bg-[#0ecb81]/10" },
  OTHER:            { label: "Khác",             color: "text-[#848e9c]", bg: "bg-[#848e9c]/10" },
}

export default function ExpenseModal({ expense, onClose }: { expense: Expense | null; onClose: () => void }) {
  const [formData, setFormData] = useState({
    category: "VPS", amount: "", note: "",
    date: new Date().toISOString().split("T")[0],
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (expense) setFormData({
      category: expense.category, amount: expense.amount.toString(),
      note: expense.note || "", date: new Date(expense.date).toISOString().split("T")[0],
    })
  }, [expense])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(expense ? `/api/expenses/${expense.id}` : "/api/expenses", {
        method: expense ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (res.ok) onClose()
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const inputClass = "w-full bg-[#0b0e11] border border-[#2b3139] rounded-lg px-3 py-2 text-sm text-[#eaecef] placeholder-[#474d57] focus:outline-none focus:border-[#fcd535]/50 transition-colors"
  const selectedCfg = CATEGORIES[formData.category] ?? CATEGORIES.OTHER

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-[#181a20] border border-[#2b3139] rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2b3139]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#f6465d]/10 rounded-lg flex items-center justify-center">
              <DollarSign size={14} className="text-[#f6465d]" />
            </div>
            <h2 className="text-sm font-bold text-[#eaecef]">
              {expense ? "Chỉnh sửa chi phí" : "Thêm chi phí"}
            </h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-[#848e9c] hover:text-[#eaecef] hover:bg-[#2b3139] rounded-lg transition-colors">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Category — visual selector */}
          <div>
            <label className="block text-xs font-medium text-[#848e9c] mb-2">
              Danh mục <span className="text-[#f6465d]">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(CATEGORIES).map(([key, cfg]) => (
                <button key={key} type="button" onClick={() => setFormData({ ...formData, category: key })}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all text-left ${
                    formData.category === key
                      ? `${cfg.bg} ${cfg.color} border-current/30`
                      : "bg-[#1e2329] border-[#2b3139] text-[#848e9c] hover:border-[#474d57]"
                  }`}>
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${formData.category === key ? "bg-current" : "bg-[#474d57]"}`} />
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-[#848e9c] mb-1.5">
              Số tiền (USDT) <span className="text-[#f6465d]">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#848e9c] font-medium">$</span>
              <input type="number" value={formData.amount} step="0.01" required placeholder="0.00"
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                className={`${inputClass} pl-7 font-mono`} />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-[#848e9c] mb-1.5">
              Ngày <span className="text-[#f6465d]">*</span>
            </label>
            <input type="date" value={formData.date} required
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              className={`${inputClass} [color-scheme:dark]`} />
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-medium text-[#848e9c] mb-1.5">Ghi chú</label>
            <textarea value={formData.note} rows={3} placeholder="Mô tả chi phí..."
              onChange={e => setFormData({ ...formData, note: e.target.value })}
              className={`${inputClass} resize-none`} />
          </div>

          {/* Preview */}
          {formData.amount && (
            <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${selectedCfg.bg} border-current/10`}>
              <span className={`text-xs font-medium ${selectedCfg.color}`}>{selectedCfg.label}</span>
              <span className={`text-sm font-bold ${selectedCfg.color}`}>−${parseFloat(formData.amount || "0").toFixed(2)}</span>
            </div>
          )}

          <div className="flex gap-2 pt-1">
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
              ) : expense ? "Cập nhật" : "Thêm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}