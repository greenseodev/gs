"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Plus, Trash2, User, Globe, CheckCircle2, Search, Link2, ExternalLink, AlertCircle } from "lucide-react"
import { formatCurrency, formatType, formatDuration, calcItemTotal, calcOrderTotal, formatDate, formatDateInput } from "@/lib/formatters"
import { calculateEndDate } from "@/lib/orderUtils"
import { toast } from "@/lib/toast"
import Link from "next/link"

type Customer = { id: string; telegramUsername: string; name: string | null }
type Website = {
  id: string; domain: string; dr: number; traffic: number
  textlinkPrices: Array<{ id: string; type: string; duration: string; price: number }>
}
type TextlinkEntry = {
  anchorText: string
  targetUrl: string
  position: number
}

type OrderItem = {
  websiteId: string; websiteDomain: string; priceId: string
  type: string; duration: string; unitPrice: number; startDate: string; endDate: string
  entries: TextlinkEntry[]
}

const STEPS = ["Khách hàng", "Chọn textlinks", "Xác nhận"]

export default function CreateOrderPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [websites, setWebsites] = useState<Website[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState("")
  const [items, setItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [editingItem, setEditingItem] = useState<{websiteId: string; priceId: string} | null>(null)
  const [anchorsText, setAnchorsText] = useState("")
  const [urlsText, setUrlsText] = useState("")
  const [discount, setDiscount] = useState(0)

  useEffect(() => {
    fetch("/api/customers").then(r => r.json()).then(data => setCustomers(Array.isArray(data) ? data : [])).catch(e => { console.error(e); setCustomers([]) })
    fetch("/api/websites").then(r => r.json()).then(data => setWebsites(Array.isArray(data) ? data : [])).catch(e => { console.error(e); setWebsites([]) })
  }, [])

  const startAddingItem = (website: Website, priceId: string) => {
    setEditingItem({websiteId: website.id, priceId})
    setAnchorsText("")
    setUrlsText("")
  }

  const cancelAddingItem = () => {
    setEditingItem(null)
    setAnchorsText("")
    setUrlsText("")
  }

  const parseLines = (text: string): string[] => {
    return text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  }

  const anchorLines = parseLines(anchorsText)
  const urlLines = parseLines(urlsText)
  const countsMatch = anchorLines.length > 0 && anchorLines.length === urlLines.length

  const confirmAddItem = (website: Website, priceId: string) => {
    const price = website.textlinkPrices.find(p => p.id === priceId)
    if (!price) return

    const anchors = parseLines(anchorsText)
    const urls = parseLines(urlsText)

    if (anchors.length === 0 || urls.length === 0) {
      toast.warning("Vui lòng nhập ít nhất 1 anchor text và 1 target URL")
      return
    }

    if (anchors.length !== urls.length) {
      toast.warning("Số lượng anchor text và URL không khớp")
      return
    }

    // Validate URLs
    for (const url of urls) {
      try {
        new URL(url)
      } catch {
        toast.error(`URL không hợp lệ: ${url}`)
        return
      }
    }

    const startDate = new Date()
    const endDate = calculateEndDate(startDate, price.duration as "ONE_MONTH" | "THREE_MONTHS")

    const entries: TextlinkEntry[] = anchors.map((anchor, i) => ({
      anchorText: anchor,
      targetUrl: urls[i],
      position: i
    }))

    setItems(prev => [...prev, {
      websiteId: website.id,
      websiteDomain: website.domain,
      priceId,
      type: price.type,
      duration: price.duration,
      unitPrice: price.price,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      entries
    }])

    setEditingItem(null)
    setAnchorsText("")
    setUrlsText("")
  }

  const removeItem = (idx: number) => setItems(p => p.filter((_, i) => i !== idx))

  const overridePrice = (idx: number, val: number) =>
    setItems(p => p.map((item, i) => i === idx ? { ...item, unitPrice: val } : item))

  const updateStartDate = (idx: number, newStartDate: string) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== idx) return item

      // Validate date string
      if (!newStartDate || newStartDate === '') return item

      const startDate = new Date(newStartDate)

      // Check if date is valid
      if (isNaN(startDate.getTime())) return item

      const endDate = calculateEndDate(startDate, item.duration as "ONE_MONTH" | "THREE_MONTHS")
      return {
        ...item,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    }))
  }

  const updateItemEntry = (itemIdx: number, entryIdx: number, field: 'anchorText' | 'targetUrl', value: string) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== itemIdx) return item
      return {
        ...item,
        entries: item.entries.map((e, ei) => ei === entryIdx ? {...e, [field]: value} : e)
      }
    }))
  }

  const submit = async () => {
    if (!selectedCustomer || !items.length) return
    setLoading(true)
    try {
      const res = await fetch("/api/orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: selectedCustomer, items, paymentStatus: "ORDERED", discount }),
      })
      if (res.ok) {
        toast.success("Đã tạo đơn hàng thành công")
        router.push("/orders")
      } else {
        toast.error("Không thể tạo đơn hàng")
      }
    } catch (e) {
      console.error(e)
      toast.error("Có lỗi xảy ra khi tạo đơn hàng")
    }
    finally { setLoading(false) }
  }

  const customer = customers.find(c => c.id === selectedCustomer)
  const filteredWebsites = websites.filter(w => w.domain.toLowerCase().includes(search.toLowerCase()) && w.textlinkPrices.length > 0)
  const total = calcOrderTotal(items, discount)
  const subtotal = calcOrderTotal(items, 0)
  const discountAmount = subtotal - total

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/orders" className="w-8 h-8 bg-[#181a20] border border-[#2b3139] rounded-lg flex items-center justify-center hover:border-[#474d57] transition-colors">
          <ArrowLeft size={15} className="text-[#848e9c]" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[#eaecef]">Tạo Đơn hàng mới</h1>
          <p className="text-xs text-[#848e9c] mt-0.5">Bước {step + 1} / {STEPS.length}</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              i === step ? "bg-[#fcd535]/10 text-[#fcd535] border border-[#fcd535]/20"
              : i < step ? "text-[#0ecb81]"
              : "text-[#848e9c]"
            }`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                i < step ? "bg-[#0ecb81] text-[#0b0e11]"
                : i === step ? "bg-[#fcd535] text-[#0b0e11]"
                : "bg-[#2b3139] text-[#848e9c]"
              }`}>
                {i < step ? <CheckCircle2 size={11} /> : i + 1}
              </div>
              {s}
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-2 ${i < step ? "bg-[#0ecb81]/40" : "bg-[#2b3139]"}`} />}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Main content */}
        <div className="lg:col-span-2">

          {/* Step 0 — Customer */}
          {step === 0 && (
            <div className="bg-[#181a20] border border-[#2b3139] rounded-xl p-6 space-y-4">
              <h2 className="text-sm font-bold text-[#eaecef] flex items-center gap-2">
                <User size={15} className="text-[#fcd535]" /> Chọn khách hàng
              </h2>
              <div className="grid gap-2">
                {customers.map(c => (
                  <div key={c.id} onClick={() => setSelectedCustomer(c.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedCustomer === c.id
                        ? "bg-[#fcd535]/5 border-[#fcd535]/30"
                        : "border-[#2b3139] hover:border-[#474d57] hover:bg-[#1e2329]"
                    }`}>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedCustomer === c.id ? "border-[#fcd535]" : "border-[#474d57]"}`}>
                      {selectedCustomer === c.id && <div className="w-2 h-2 rounded-full bg-[#fcd535]" />}
                    </div>
                    <div className="w-8 h-8 bg-[#1e2329] rounded-lg flex items-center justify-center text-xs font-bold text-[#fcd535]">
                      {(c.name || c.telegramUsername)[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#eaecef]">{c.name || "—"}</p>
                      <p className="text-xs text-[#848e9c]">{c.telegramUsername}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-2">
                <button onClick={() => setStep(1)} disabled={!selectedCustomer}
                  className="flex items-center gap-1.5 text-xs text-[#0b0e11] bg-gradient-to-r from-[#fcd535] to-[#f0b90b] px-4 py-2 rounded-lg font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:from-[#f0b90b] hover:to-[#fcd535] transition-all">
                  Tiếp theo <ArrowRight size={12} />
                </button>
              </div>
            </div>
          )}

          {/* Step 1 — Pick textlinks */}
          {step === 1 && (
            <div className="bg-[#181a20] border border-[#2b3139] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#2b3139] space-y-3">
                <h2 className="text-sm font-bold text-[#eaecef] flex items-center gap-2">
                  <Globe size={15} className="text-[#fcd535]" /> Chọn textlinks
                </h2>
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#848e9c]" />
                  <input type="text" placeholder="Tìm domain..." value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-lg pl-8 pr-4 py-1.5 text-xs text-[#eaecef] placeholder-[#848e9c] focus:outline-none focus:border-[#fcd535]/50" />
                </div>
              </div>
              <div className="divide-y divide-[#2b3139] max-h-[480px] overflow-y-auto">
                {filteredWebsites.map(website => (
                  <div key={website.id} className="px-5 py-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Globe size={13} className="text-[#848e9c]" />
                      <span className="text-xs font-semibold text-[#eaecef]">{website.domain}</span>
                      <span className="text-xs text-[#848e9c]">DR {website.dr}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {website.textlinkPrices.slice(0, 4).map(price => {
                        const alreadyAdded = items.some(i => i.websiteId === website.id && i.priceId === price.id)
                        const isEditing = editingItem?.websiteId === website.id && editingItem?.priceId === price.id

                        return (
                          <div key={price.id} className="col-span-2">
                            <button
                              onClick={() => !alreadyAdded && !isEditing && startAddingItem(website, price.id)}
                              disabled={alreadyAdded}
                              className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all ${
                                alreadyAdded
                                  ? "bg-[#0ecb81]/5 border-[#0ecb81]/20 text-[#0ecb81] cursor-default"
                                  : isEditing
                                  ? "bg-[#fcd535]/10 border-[#fcd535]/30"
                                  : "bg-[#1e2329] border-[#2b3139] hover:border-[#fcd535]/40 hover:bg-[#fcd535]/5"
                              }`}>
                              <p className="text-[#848e9c] mb-0.5">
                                {formatType(price.type as any)} · {formatDuration(price.duration as any)}
                              </p>
                              <p className={`font-bold ${alreadyAdded ? "text-[#0ecb81]" : "text-[#fcd535] font-mono"}`}>
                                {alreadyAdded ? "✓ Đã thêm" : formatCurrency(price.price)}
                              </p>
                            </button>

                            {/* Inline bulk entry form */}
                            {isEditing && (
                              <div className="mt-2 bg-[#0b0e11] border border-[#fcd535]/30 rounded-lg p-3 space-y-3">
                                <p className="text-xs font-semibold text-[#fcd535]">Nhập danh sách textlinks</p>
                                <p className="text-xs text-[#848e9c]">Mỗi dòng 1 anchor text / 1 URL</p>

                                <div className="grid grid-cols-2 gap-3">
                                  {/* Anchors textarea */}
                                  <div>
                                    <label className="text-xs font-medium text-[#b7bdc6] mb-1.5 block">Anchor text</label>
                                    <textarea
                                      value={anchorsText}
                                      onChange={e => setAnchorsText(e.target.value)}
                                      placeholder={"mua giày nike\ngiày thể thao nam\ngiày chạy bộ"}
                                      rows={6}
                                      className="w-full bg-[#181a20] border border-[#2b3139] rounded px-2.5 py-2 text-xs text-[#eaecef] placeholder-[#848e9c] focus:outline-none focus:border-[#fcd535]/50 resize-y font-mono"
                                    />
                                  </div>

                                  {/* URLs textarea */}
                                  <div>
                                    <label className="text-xs font-medium text-[#b7bdc6] mb-1.5 block">Target URL</label>
                                    <textarea
                                      value={urlsText}
                                      onChange={e => setUrlsText(e.target.value)}
                                      placeholder={"https://example.com/nike\nhttps://example.com/sport\nhttps://example.com/run"}
                                      rows={6}
                                      className="w-full bg-[#181a20] border border-[#2b3139] rounded px-2.5 py-2 text-xs text-[#eaecef] placeholder-[#848e9c] focus:outline-none focus:border-[#fcd535]/50 resize-y font-mono"
                                    />
                                  </div>
                                </div>

                                {/* Counter */}
                                <div className="flex items-center justify-between text-xs pt-1">
                                  <div className="flex items-center gap-3">
                                    <span className="text-[#848e9c]">{anchorLines.length} anchors</span>
                                    <span className="text-[#848e9c]">{urlLines.length} urls</span>
                                  </div>
                                  {anchorLines.length > 0 && urlLines.length > 0 && (
                                    countsMatch ? (
                                      <span className="flex items-center gap-1 text-[#0ecb81] font-medium">
                                        <CheckCircle2 size={11} /> Khớp
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-1 text-[#f6465d] font-medium">
                                        <AlertCircle size={11} /> Không khớp
                                      </span>
                                    )
                                  )}
                                </div>

                                <div className="flex gap-2 pt-1 border-t border-[#2b3139]">
                                  <button
                                    onClick={() => confirmAddItem(website, price.id)}
                                    disabled={!countsMatch}
                                    className="flex-1 bg-gradient-to-r from-[#fcd535] to-[#f0b90b] text-[#0b0e11] px-3 py-1.5 rounded text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:from-[#f0b90b] hover:to-[#fcd535] transition-all"
                                  >
                                    Thêm vào đơn
                                  </button>
                                  <button
                                    onClick={cancelAddingItem}
                                    className="flex-1 border border-[#2b3139] hover:border-[#474d57] text-[#b7bdc6] px-3 py-1.5 rounded text-xs font-medium transition-colors"
                                  >
                                    Hủy
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-4 border-t border-[#2b3139] flex justify-between">
                <button onClick={() => setStep(0)} className="text-xs text-[#848e9c] bg-[#1e2329] border border-[#2b3139] px-4 py-2 rounded-lg hover:border-[#474d57] transition-colors font-medium">
                  Quay lại
                </button>
                <button onClick={() => setStep(2)} disabled={!items.length}
                  className="flex items-center gap-1.5 text-xs text-[#0b0e11] bg-gradient-to-r from-[#fcd535] to-[#f0b90b] px-4 py-2 rounded-lg font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:from-[#f0b90b] hover:to-[#fcd535] transition-all">
                  Tiếp theo <ArrowRight size={12} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Confirm & override price */}
          {step === 2 && (
            <div className="bg-[#181a20] border border-[#2b3139] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#2b3139]">
                <h2 className="text-sm font-bold text-[#eaecef] flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-[#fcd535]" /> Xác nhận & điều chỉnh
                </h2>
              </div>
              <div className="divide-y divide-[#2b3139]">
                {items.map((item, itemIdx) => (
                  <div key={itemIdx} className="px-5 py-4">
                    <div className="space-y-3 mb-3">
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 bg-[#1e2329] border border-[#2b3139] rounded-lg flex items-center justify-center flex-shrink-0">
                          <Globe size={13} className="text-[#848e9c]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#eaecef]">{item.websiteDomain}</p>
                          <p className="text-xs text-[#848e9c]">
                            {formatType(item.type as any)} · {formatDuration(item.duration as any)} · {item.entries.length} link{item.entries.length > 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="number" value={item.unitPrice} step="0.01"
                            onChange={e => overridePrice(itemIdx, parseFloat(e.target.value))}
                            className="w-28 bg-[#0b0e11] border border-[#2b3139] rounded-lg px-3 py-1.5 text-xs text-[#fcd535] font-bold text-right focus:outline-none focus:border-[#fcd535]/50" />
                          <button onClick={() => removeItem(itemIdx)} className="w-7 h-7 flex items-center justify-center text-[#f6465d] bg-[#f6465d]/10 border border-[#f6465d]/20 rounded-lg hover:bg-[#f6465d]/20 transition-colors">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Date inputs */}
                      <div className="ml-10 grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-[#b7bdc6] mb-1.5 block">Ngày bắt đầu</label>
                          <input
                            type="date"
                            value={formatDateInput(item.startDate)}
                            onChange={e => updateStartDate(itemIdx, e.target.value)}
                            className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-lg px-3 py-1.5 text-xs text-[#eaecef] focus:outline-none focus:border-[#fcd535]/50"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-[#b7bdc6] mb-1.5 block">Ngày kết thúc (tự động)</label>
                          <input
                            type="text"
                            value={formatDate(item.endDate)}
                            readOnly
                            className="w-full bg-[#1e2329] border border-[#2b3139] rounded-lg px-3 py-1.5 text-xs text-[#848e9c] cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Display entries */}
                    <div className="ml-10 space-y-2">
                      {item.entries.map((entry, entryIdx) => (
                        <div key={entryIdx} className="bg-[#0b0e11] border border-[#2b3139] rounded-lg p-2.5 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <Link2 size={11} className="text-[#848e9c] flex-shrink-0" />
                            <input
                              type="text"
                              value={entry.anchorText}
                              onChange={e => updateItemEntry(itemIdx, entryIdx, 'anchorText', e.target.value)}
                              placeholder="Anchor text"
                              className="flex-1 bg-transparent border-none text-xs text-[#eaecef] placeholder-[#848e9c] focus:outline-none"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <ExternalLink size={11} className="text-[#848e9c] flex-shrink-0" />
                            <input
                              type="url"
                              value={entry.targetUrl}
                              onChange={e => updateItemEntry(itemIdx, entryIdx, 'targetUrl', e.target.value)}
                              placeholder="Target URL"
                              className="flex-1 bg-transparent border-none text-xs text-[#5b8def] placeholder-[#848e9c] focus:outline-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Discount section */}
              <div className="px-5 py-4 border-t border-[#2b3139] space-y-3">
                <label className="text-xs font-semibold text-[#eaecef]">Chiết khấu (%)</label>
                <div className="flex gap-2">
                  {[0, 5, 10, 15, 20].map(val => (
                    <button
                      key={val}
                      onClick={() => setDiscount(val)}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        discount === val
                          ? "bg-[#fcd535] text-[#0b0e11]"
                          : "bg-[#1e2329] border border-[#2b3139] text-[#b7bdc6] hover:border-[#474d57]"
                      }`}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={discount}
                  onChange={e => {
                    const val = parseFloat(e.target.value) || 0
                    // Clamp discount between 0-100
                    setDiscount(Math.max(0, Math.min(100, val)))
                  }}
                  placeholder="Hoặc nhập % tùy chỉnh"
                  className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-lg px-3 py-2 text-xs text-[#eaecef] placeholder-[#848e9c] focus:outline-none focus:border-[#fcd535]/50"
                />
              </div>

              <div className="px-5 py-4 border-t border-[#2b3139] flex justify-between items-center">
                <button onClick={() => setStep(1)} className="text-xs text-[#848e9c] bg-[#1e2329] border border-[#2b3139] px-4 py-2 rounded-lg hover:border-[#474d57] transition-colors font-medium">
                  Quay lại
                </button>
                <button onClick={submit} disabled={loading}
                  className="flex items-center gap-1.5 text-xs text-[#0b0e11] bg-gradient-to-r from-[#fcd535] to-[#f0b90b] px-5 py-2 rounded-lg font-medium disabled:opacity-40 hover:from-[#f0b90b] hover:to-[#fcd535] transition-all">
                  {loading ? "Đang tạo..." : "Xác nhận tạo đơn"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order summary sidebar */}
        <div className="bg-[#181a20] border border-[#2b3139] rounded-xl p-5 h-fit sticky top-6 space-y-4">
          <h3 className="text-sm font-bold text-[#eaecef]">Tóm tắt đơn hàng</h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-[#848e9c]">Khách hàng</span>
              <span className="text-[#eaecef] font-medium">{customer?.name || customer?.telegramUsername || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#848e9c]">Số gói</span>
              <span className="text-[#eaecef] font-medium">{items.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#848e9c]">Số links</span>
              <span className="text-[#eaecef] font-medium">{items.reduce((sum, item) => sum + item.entries.length, 0)}</span>
            </div>
          </div>

          {items.length > 0 && (
            <div className="border-t border-[#2b3139] pt-3 space-y-1.5">
              {items.map((item, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-[#848e9c] truncate max-w-[120px]">{item.websiteDomain} ({item.entries.length})</span>
                  <span className="text-[#b7bdc6] font-medium font-mono">{formatCurrency(calcItemTotal(item.unitPrice, item.entries.length))}</span>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-[#2b3139] pt-3 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-[#848e9c]">Tạm tính</span>
              <span className="text-[#eaecef] font-medium font-mono">{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-[#848e9c]">Chiết khấu</span>
                <span className="text-[#f6465d] font-medium font-mono">-{formatCurrency(discountAmount)} ({discount}%)</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-[#2b3139]">
              <span className="text-xs text-[#848e9c]">Tổng cộng</span>
              <span className="text-xl font-bold text-[#fcd535] font-mono">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
