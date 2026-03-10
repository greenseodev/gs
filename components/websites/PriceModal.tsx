"use client"

import { useState } from "react"
import { X } from "lucide-react"
import Select from "@/components/ui/Select"

type Website = {
  id: string
  domain: string
}

type Props = {
  website: Website
  onClose: () => void
}

export default function PriceModal({ website, onClose }: Props) {
  const [formData, setFormData] = useState({
    type: "FOOTER",
    duration: "ONE_MONTH",
    price: "",
    effectiveFrom: new Date().toISOString().split("T")[0],
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/websites/${website.id}/prices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        onClose()
      }
    } catch (error) {
      console.error("Error saving price:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#181a20] rounded-2xl p-6 w-full max-w-md border border-[#2b3139] shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#eaecef]">
            Thêm giá textlink cho {website.domain}
          </h2>
          <button
            onClick={onClose}
            className="text-[#848e9c] hover:text-[#eaecef] transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#eaecef] mb-1.5">
              Loại textlink
            </label>
            <Select
              value={formData.type}
              onChange={(value) => setFormData({ ...formData, type: value })}
              options={[
                { value: "FOOTER", label: "Footer" },
                { value: "HOMEPAGE", label: "Homepage" },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#eaecef] mb-1.5">
              Thời hạn
            </label>
            <Select
              value={formData.duration}
              onChange={(value) => setFormData({ ...formData, duration: value })}
              options={[
                { value: "ONE_MONTH", label: "1 tháng" },
                { value: "THREE_MONTHS", label: "3 tháng" },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#eaecef] mb-1">
              Giá (USDT)
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              required
              min="0"
              step="0.01"
              className="w-full px-3 py-2 bg-[#0b0e11] border border-[#2b3139] rounded-lg text-[#eaecef] focus:outline-none focus:ring-2 focus:ring-[#fcd535] focus:border-[#fcd535] placeholder:text-[#848e9c]"
              placeholder="50.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#eaecef] mb-1">
              Ngày áp dụng giá
            </label>
            <input
              type="date"
              value={formData.effectiveFrom}
              onChange={(e) =>
                setFormData({ ...formData, effectiveFrom: e.target.value })
              }
              required
              className="w-full px-3 py-2 bg-[#0b0e11] border border-[#2b3139] rounded-lg text-[#eaecef] focus:outline-none focus:ring-2 focus:ring-[#fcd535] focus:border-[#fcd535]"
            />
            <p className="text-xs text-[#848e9c] mt-1">
              Có thể chọn ngày trong quá khứ để ghi lại lịch sử giá
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-[#fcd535] to-[#f0b90b] hover:from-[#f0b90b] hover:to-[#fcd535] text-[#0b0e11] py-2 rounded-lg transition-all disabled:opacity-50 font-semibold glow-primary"
            >
              {loading ? "Đang lưu..." : "Thêm giá"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-[#2b3139] hover:border-[#474d57] text-[#eaecef] py-2 rounded-lg transition-colors font-medium"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
