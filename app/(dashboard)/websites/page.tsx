"use client"

import { useEffect, useState } from "react"
import { Plus, Edit, Trash2, DollarSign, Globe, TrendingUp, Search, ExternalLink, Eye, Lock, User as UserIcon, Copy, Check } from "lucide-react"
import { formatCurrency, formatType, formatDuration } from "@/lib/formatters"
import { toast } from "@/lib/toast"
import WebsiteModal from "@/components/websites/WebsiteModal"
import PriceModal from "@/components/websites/PriceModal"

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
  createdAt: string
  textlinkPrices: Array<{
    id: string
    type: string
    duration: string
    price: number
    effectiveFrom: string
  }>
}

function DRBadge({ dr }: { dr: number }) {
  const color =
    dr >= 70 ? "bg-[#0ecb81]/10 text-[#0ecb81] border-[#0ecb81]/20" :
    dr >= 40 ? "bg-[#f0b90b]/10 text-[#f0b90b] border-[#f0b90b]/20" :
               "bg-[#848e9c]/10 text-[#848e9c] border-[#848e9c]/20"
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded border ${color}`}>
      DR {dr}
    </span>
  )
}

function TrafficBadge({ traffic }: { traffic: number }) {
  const formatted = traffic >= 1000 ? `${(traffic / 1000).toFixed(1)}K` : traffic.toString()
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-[#5b8def]/10 text-[#5b8def] border border-[#5b8def]/20">
      <TrendingUp size={10} />
      {formatted}
    </span>
  )
}

function PriceTag({ type, duration, price }: { type: string; duration: string; price: number }) {
  return (
    <div className="bg-[#1e2329] border border-[#2b3139] rounded-lg px-2.5 py-2 flex flex-col gap-1 hover:border-[#474d57] transition-colors">
      <span className="text-[10px] text-[#848e9c] uppercase tracking-wide font-medium">
        {formatType(type as any)} · {formatDuration(duration as any)}
      </span>
      <span className="text-xs font-bold text-[#fcd535] font-mono">{formatCurrency(price)}</span>
    </div>
  )
}

export default function WebsitesPage() {
  const [websites, setWebsites] = useState<Website[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [priceModalOpen, setPriceModalOpen] = useState(false)
  const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(null)
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({})
  const [copiedField, setCopiedField] = useState<string | null>(null)

  useEffect(() => { fetchWebsites() }, [])

  const fetchWebsites = async () => {
    try {
      const res = await fetch("/api/websites")
      const data = await res.json()
      setWebsites(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching websites:", error)
      setWebsites([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa website này?")) return
    try {
      const res = await fetch(`/api/websites/${id}`, { method: "DELETE" })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Không thể xóa website")
        return
      }

      toast.success("Đã xóa website thành công")
      fetchWebsites()
    } catch (error) {
      console.error("Error deleting website:", error)
      toast.error("Có lỗi xảy ra khi xóa website")
    }
  }

  const togglePassword = (id: string) => {
    setShowPassword(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const copyToClipboard = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldId)
      toast.success("Đã copy vào clipboard")
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      toast.error("Không thể copy")
    }
  }

  const filtered = websites.filter(w =>
    w.domain.toLowerCase().includes(search.toLowerCase())
  )

  const totalTraffic = websites.reduce((sum, w) => sum + w.traffic, 0)
  const avgDR = websites.length > 0 ? Math.round(websites.reduce((sum, w) => sum + w.dr, 0) / websites.length) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-[#fcd535] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#eaecef]">Quản lý Website</h1>
          <p className="text-xs text-[#848e9c] mt-0.5">{websites.length} website · Traffic {totalTraffic.toLocaleString()}</p>
        </div>
        <button
          onClick={() => { setSelectedWebsite(null); setModalOpen(true) }}
          className="flex items-center gap-1.5 text-xs text-[#0b0e11] bg-gradient-to-r from-[#fcd535] to-[#f0b90b] px-3 py-1.5 rounded-lg font-medium hover:from-[#f0b90b] hover:to-[#fcd535] transition-all glow-primary"
        >
          <Plus size={13} /> Thêm Website
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-[#181a20] border border-[#2b3139] rounded-lg px-4 py-3 flex items-center gap-3">
          <div className="w-7 h-7 bg-[#fcd535]/10 rounded-md flex items-center justify-center shrink-0">
            <Globe size={14} className="text-[#fcd535]" />
          </div>
          <div>
            <p className="text-xs text-[#848e9c]">Tổng website</p>
            <p className="text-sm font-bold text-[#fcd535]">{websites.length}</p>
          </div>
        </div>

        <div className="bg-[#181a20] border border-[#2b3139] rounded-lg px-4 py-3 flex items-center gap-3">
          <div className="w-7 h-7 bg-[#5b8def]/10 rounded-md flex items-center justify-center shrink-0">
            <TrendingUp size={14} className="text-[#5b8def]" />
          </div>
          <div>
            <p className="text-xs text-[#848e9c]">Traffic/tháng</p>
            <p className="text-sm font-bold text-[#5b8def]">{(totalTraffic / 1000).toFixed(1)}K</p>
          </div>
        </div>

        <div className="bg-[#181a20] border border-[#2b3139] rounded-lg px-4 py-3 flex items-center gap-3">
          <div className="w-7 h-7 bg-[#0ecb81]/10 rounded-md flex items-center justify-center shrink-0">
            <DollarSign size={14} className="text-[#0ecb81]" />
          </div>
          <div>
            <p className="text-xs text-[#848e9c]">Có bảng giá</p>
            <p className="text-sm font-bold text-[#0ecb81]">{websites.filter(w => w.textlinkPrices.length > 0).length}</p>
          </div>
        </div>

        <div className="bg-[#181a20] border border-[#2b3139] rounded-lg px-4 py-3 flex items-center gap-3">
          <div className="w-7 h-7 bg-[#f0b90b]/10 rounded-md flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-[#f0b90b]">DR</span>
          </div>
          <div>
            <p className="text-xs text-[#848e9c]">DR trung bình</p>
            <p className="text-sm font-bold text-[#f0b90b]">{avgDR}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#848e9c]" />
        <input
          type="text"
          placeholder="Tìm kiếm domain..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-[#181a20] border border-[#2b3139] rounded-lg pl-9 pr-4 py-2 text-sm text-[#eaecef] placeholder-[#848e9c] focus:outline-none focus:border-[#fcd535]/50 transition-colors"
        />
      </div>

      {/* Website grid - 2 columns */}
      <div className="grid lg:grid-cols-2 gap-4">
        {filtered.map((website) => (
          <div key={website.id} className="bg-[#181a20] border border-[#2b3139] rounded-xl overflow-hidden hover:border-[#474d57] transition-all card-hover">

            {/* Header */}
            <div className="px-4 py-3.5 bg-gradient-to-r from-[#1e2329] to-[#181a20] border-b border-[#2b3139]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Globe size={14} className="text-[#fcd535]" />
                  <h3 className="text-sm font-bold text-[#eaecef]">{website.domain}</h3>
                  <a
                    href={`https://${website.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#848e9c] hover:text-[#fcd535] transition-colors"
                  >
                    <ExternalLink size={11} />
                  </a>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => { setSelectedWebsite(website); setPriceModalOpen(true) }}
                    className="flex items-center gap-1 text-xs text-[#0ecb81] bg-[#0ecb81]/10 border border-[#0ecb81]/20 px-2 py-1 rounded hover:bg-[#0ecb81]/20 transition-colors font-medium"
                  >
                    <DollarSign size={10} />
                  </button>
                  <button
                    onClick={() => { setSelectedWebsite(website); setModalOpen(true) }}
                    className="flex items-center gap-1 text-xs text-[#5b8def] bg-[#5b8def]/10 border border-[#5b8def]/20 px-2 py-1 rounded hover:bg-[#5b8def]/20 transition-colors font-medium"
                  >
                    <Edit size={10} />
                  </button>
                  <button
                    onClick={() => handleDelete(website.id)}
                    className="flex items-center gap-1 text-xs text-[#f6465d] bg-[#f6465d]/10 border border-[#f6465d]/20 px-2 py-1 rounded hover:bg-[#f6465d]/20 transition-colors font-medium"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2">
                <DRBadge dr={website.dr} />
                <TrafficBadge traffic={website.traffic} />
                <span className="text-xs text-[#848e9c]">
                  Mua: <span className="text-[#fcd535] font-semibold font-mono">{formatCurrency(website.buyPrice)}</span>
                </span>
              </div>
            </div>

            {/* WordPress credentials */}
            {(website.wpUrl || website.wpUsername || website.wpPassword) && (
              <div className="px-4 py-3 bg-[#0b0e11] border-b border-[#2b3139]">
                <div className="flex items-center gap-1.5 mb-2">
                  <Lock size={11} className="text-[#5b8def]" />
                  <span className="text-[10px] font-semibold text-[#5b8def] uppercase tracking-wide">WordPress Admin</span>
                </div>
                <div className="space-y-2">
                  {/* WP Admin URL */}
                  {website.wpUrl && (
                    <div className="flex items-center gap-2 bg-[#181a20] border border-[#2b3139] rounded-lg px-2.5 py-2 hover:border-[#474d57] transition-colors group">
                      <Globe size={11} className="text-[#848e9c] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-[#848e9c] mb-0.5">URL</div>
                        <a
                          href={website.wpUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#5b8def] font-mono hover:text-[#fcd535] transition-colors truncate block"
                        >
                          {website.wpUrl}
                        </a>
                      </div>
                      <button
                        onClick={() => copyToClipboard(website.wpUrl!, `${website.id}-url`)}
                        className="shrink-0 p-1.5 rounded hover:bg-[#2b3139] transition-colors opacity-0 group-hover:opacity-100"
                        title="Copy URL"
                      >
                        {copiedField === `${website.id}-url` ? (
                          <Check size={11} className="text-[#0ecb81]" />
                        ) : (
                          <Copy size={11} className="text-[#848e9c]" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Username & Password Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {website.wpUsername && (
                      <div className="flex items-center gap-2 bg-[#181a20] border border-[#2b3139] rounded-lg px-2.5 py-2 hover:border-[#474d57] transition-colors group">
                        <UserIcon size={11} className="text-[#848e9c] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] text-[#848e9c] mb-0.5">Username</div>
                          <div className="text-xs text-[#eaecef] font-mono truncate">{website.wpUsername}</div>
                        </div>
                        <button
                          onClick={() => copyToClipboard(website.wpUsername!, `${website.id}-user`)}
                          className="shrink-0 p-1.5 rounded hover:bg-[#2b3139] transition-colors opacity-0 group-hover:opacity-100"
                          title="Copy username"
                        >
                          {copiedField === `${website.id}-user` ? (
                            <Check size={11} className="text-[#0ecb81]" />
                          ) : (
                            <Copy size={11} className="text-[#848e9c]" />
                          )}
                        </button>
                      </div>
                    )}

                    {website.wpPassword && (
                      <div className="flex items-center gap-2 bg-[#181a20] border border-[#2b3139] rounded-lg px-2.5 py-2 hover:border-[#474d57] transition-colors group">
                        <Lock size={11} className="text-[#848e9c] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] text-[#848e9c] mb-0.5">Password</div>
                          <div className="text-xs text-[#eaecef] font-mono truncate">
                            {showPassword[website.id] ? website.wpPassword : "••••••••"}
                          </div>
                        </div>
                        <button
                          onClick={() => togglePassword(website.id)}
                          className="shrink-0 p-1.5 rounded hover:bg-[#2b3139] transition-colors"
                          title="Toggle visibility"
                        >
                          <Eye size={11} className="text-[#5b8def]" />
                        </button>
                        <button
                          onClick={() => copyToClipboard(website.wpPassword!, `${website.id}-pass`)}
                          className="shrink-0 p-1.5 rounded hover:bg-[#2b3139] transition-colors opacity-0 group-hover:opacity-100"
                          title="Copy password"
                        >
                          {copiedField === `${website.id}-pass` ? (
                            <Check size={11} className="text-[#0ecb81]" />
                          ) : (
                            <Copy size={11} className="text-[#848e9c]" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Price table */}
            {website.textlinkPrices.length > 0 ? (
              <div className="p-3">
                <p className="text-xs text-[#848e9c] mb-2 font-medium">Bảng giá</p>
                <div className="grid grid-cols-2 gap-2">
                  {website.textlinkPrices.slice(0, 4).map((price) => (
                    <PriceTag
                      key={price.id}
                      type={price.type}
                      duration={price.duration}
                      price={price.price}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3">
                <button
                  onClick={() => { setSelectedWebsite(website); setPriceModalOpen(true) }}
                  className="text-xs text-[#848e9c] hover:text-[#fcd535] transition-colors flex items-center gap-1"
                >
                  <Plus size={11} /> Thêm bảng giá
                </button>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-16 bg-[#181a20] border border-[#2b3139] rounded-xl">
            <Globe size={32} className="text-[#474d57] mx-auto mb-3" />
            <p className="text-sm text-[#848e9c]">
              {search ? `Không tìm thấy website nào với "${search}"` : "Chưa có website nào"}
            </p>
            {!search && (
              <button
                onClick={() => { setSelectedWebsite(null); setModalOpen(true) }}
                className="mt-3 text-xs text-[#fcd535] hover:underline"
              >
                Thêm website đầu tiên
              </button>
            )}
          </div>
        )}
      </div>

      {modalOpen && (
        <WebsiteModal website={selectedWebsite} onClose={() => { setModalOpen(false); setSelectedWebsite(null); fetchWebsites() }} />
      )}
      {priceModalOpen && selectedWebsite && (
        <PriceModal website={selectedWebsite} onClose={() => { setPriceModalOpen(false); setSelectedWebsite(null); fetchWebsites() }} />
      )}
    </div>
  )
}
