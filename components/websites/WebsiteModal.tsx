"use client"

import { useState, useEffect } from "react"
import { X, Lock, User } from "lucide-react"

type Website = {
  id: string
  domain: string
  dr: number
  traffic: number
  buyPrice: number
  purchaseDate: string
  wpUrl: string | null
  wpUsername: string | null
  wpPassword: string | null
}

type Props = {
  website: Website | null
  onClose: () => void
}

export default function WebsiteModal({ website, onClose }: Props) {
  const [formData, setFormData] = useState({
    domain: "",
    dr: "",
    traffic: "",
    buyPrice: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    wpUrl: "",
    wpUsername: "",
    wpPassword: "",
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (website) {
      let dateString = new Date().toISOString().split("T")[0]
      try {
        const date = new Date(website.purchaseDate)
        if (!isNaN(date.getTime())) {
          dateString = date.toISOString().split("T")[0]
        }
      } catch (e) {
        console.error("Invalid purchaseDate:", website.purchaseDate)
      }

      setFormData({
        domain: website.domain,
        dr: website.dr.toString(),
        traffic: website.traffic.toString(),
        buyPrice: website.buyPrice.toString(),
        purchaseDate: dateString,
        wpUrl: website.wpUrl || "",
        wpUsername: website.wpUsername || "",
        wpPassword: website.wpPassword || "",
      })
    }
  }, [website])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = website ? `/api/websites/${website.id}` : "/api/websites"
      const method = website ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        onClose()
      }
    } catch (error) {
      console.error("Error saving website:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#181a20] rounded-2xl p-6 w-full max-w-md border border-[#2b3139] shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#eaecef]">
            {website ? "Chỉnh sửa Website" : "Thêm Website"}
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
            <label className="block text-sm font-medium text-[#eaecef] mb-1">
              Domain
            </label>
            <input
              type="text"
              value={formData.domain}
              onChange={(e) =>
                setFormData({ ...formData, domain: e.target.value })
              }
              required
              className="w-full px-3 py-2 bg-[#0b0e11] border border-[#2b3139] rounded-lg text-[#eaecef] focus:outline-none focus:ring-2 focus:ring-[#fcd535] focus:border-[#fcd535] placeholder:text-[#848e9c]"
              placeholder="example.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#eaecef] mb-1">
                DR
              </label>
              <input
                type="number"
                value={formData.dr}
                onChange={(e) =>
                  setFormData({ ...formData, dr: e.target.value })
                }
                required
                min="0"
                max="100"
                className="w-full px-3 py-2 bg-[#0b0e11] border border-[#2b3139] rounded-lg text-[#eaecef] focus:outline-none focus:ring-2 focus:ring-[#fcd535] focus:border-[#fcd535] placeholder:text-[#848e9c]"
                placeholder="50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#eaecef] mb-1">
                Traffic/tháng
              </label>
              <input
                type="number"
                value={formData.traffic}
                onChange={(e) =>
                  setFormData({ ...formData, traffic: e.target.value })
                }
                required
                min="0"
                className="w-full px-3 py-2 bg-[#0b0e11] border border-[#2b3139] rounded-lg text-[#eaecef] focus:outline-none focus:ring-2 focus:ring-[#fcd535] focus:border-[#fcd535] placeholder:text-[#848e9c]"
                placeholder="10000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#eaecef] mb-1">
                Giá mua (USDT)
              </label>
              <input
                type="number"
                value={formData.buyPrice}
                onChange={(e) =>
                  setFormData({ ...formData, buyPrice: e.target.value })
                }
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 bg-[#0b0e11] border border-[#2b3139] rounded-lg text-[#eaecef] focus:outline-none focus:ring-2 focus:ring-[#fcd535] focus:border-[#fcd535] placeholder:text-[#848e9c]"
                placeholder="500.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#eaecef] mb-1">
                Ngày mua
              </label>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) =>
                  setFormData({ ...formData, purchaseDate: e.target.value })
                }
                required
                className="w-full px-3 py-2 bg-[#0b0e11] border border-[#2b3139] rounded-lg text-[#eaecef] focus:outline-none focus:ring-2 focus:ring-[#fcd535] focus:border-[#fcd535]"
              />
            </div>
          </div>

          {/* WordPress Credentials */}
          <div className="border-t border-[#2b3139] pt-4 mt-4">
            <h3 className="text-sm font-semibold text-[#eaecef] mb-3 flex items-center gap-2">
              <Lock size={14} className="text-[#5b8def]" />
              WordPress Admin (tùy chọn)
            </h3>

            <div className="space-y-3">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-[#b7bdc6] mb-1">
                  <Lock size={11} />
                  Admin URL
                </label>
                <input
                  type="url"
                  value={formData.wpUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, wpUrl: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#0b0e11] border border-[#2b3139] rounded-lg text-[#eaecef] focus:outline-none focus:ring-2 focus:ring-[#5b8def] focus:border-[#5b8def] placeholder:text-[#848e9c] font-mono text-sm"
                  placeholder="https://example.com/wp-admin"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-[#b7bdc6] mb-1">
                  <User size={11} />
                  Username
                </label>
                <input
                  type="text"
                  value={formData.wpUsername}
                  onChange={(e) =>
                    setFormData({ ...formData, wpUsername: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#0b0e11] border border-[#2b3139] rounded-lg text-[#eaecef] focus:outline-none focus:ring-2 focus:ring-[#5b8def] focus:border-[#5b8def] placeholder:text-[#848e9c] font-mono text-sm"
                  placeholder="admin"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-[#b7bdc6] mb-1">
                  <Lock size={11} />
                  Password
                </label>
                <input
                  type="text"
                  value={formData.wpPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, wpPassword: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#0b0e11] border border-[#2b3139] rounded-lg text-[#eaecef] focus:outline-none focus:ring-2 focus:ring-[#5b8def] focus:border-[#5b8def] placeholder:text-[#848e9c] font-mono text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-[#fcd535] to-[#f0b90b] hover:from-[#f0b90b] hover:to-[#fcd535] text-[#0b0e11] py-2 rounded-lg transition-all disabled:opacity-50 font-semibold glow-primary"
            >
              {loading ? "Đang lưu..." : website ? "Cập nhật" : "Thêm"}
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
