"use client"

import { useState, useEffect } from "react"
import { X, AlertCircle, Save } from "lucide-react"

type TextlinkEntry = {
  id: string
  anchorText: string
  targetUrl: string
  position: number
}

type EditEntriesModalProps = {
  isOpen: boolean
  onClose: () => void
  itemId: string
  orderId: string
  entries: TextlinkEntry[]
  onSave: () => void
}

export default function EditEntriesModal({ isOpen, onClose, itemId, orderId, entries, onSave }: EditEntriesModalProps) {
  const [anchors, setAnchors] = useState("")
  const [urls, setUrls] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setAnchors(entries.map(e => e.anchorText).join("\n"))
      setUrls(entries.map(e => e.targetUrl).join("\n"))
      setError("")
    }
  }, [isOpen, entries])

  if (!isOpen) return null

  const handleSave = async () => {
    const anchorLines = anchors.trim().split("\n").filter(l => l.trim())
    const urlLines = urls.trim().split("\n").filter(l => l.trim())

    if (anchorLines.length !== urlLines.length) {
      setError(`Số lượng không khớp: ${anchorLines.length} anchor nhưng ${urlLines.length} URL`)
      return
    }

    if (anchorLines.length === 0) {
      setError("Phải có ít nhất 1 textlink")
      return
    }

    setSaving(true)
    setError("")

    try {
      const newEntries = anchorLines.map((anchor, idx) => ({
        anchorText: anchor.trim(),
        targetUrl: urlLines[idx].trim(),
        position: idx,
      }))

      const res = await fetch(`/api/orders/${orderId}/items/${itemId}/entries`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: newEntries }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update entries")
      }

      onSave()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra")
    } finally {
      setSaving(false)
    }
  }

  const anchorCount = anchors.trim().split("\n").filter(l => l.trim()).length
  const urlCount = urls.trim().split("\n").filter(l => l.trim()).length
  const countMatch = anchorCount === urlCount

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#181a20] border border-[#2b3139] rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#2b3139] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#eaecef]">Sửa Textlinks</h2>
            <p className="text-xs text-[#848e9c] mt-0.5">Mỗi dòng = 1 link. Số dòng bên trái và phải phải bằng nhau.</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 bg-[#1e2329] border border-[#2b3139] rounded-lg flex items-center justify-center hover:border-[#474d57] transition-colors">
            <X size={14} className="text-[#848e9c]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-2 gap-4">
            {/* Anchors */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#eaecef]">Anchor Text</label>
                <span className={`text-xs font-mono ${countMatch ? "text-[#0ecb81]" : "text-[#f6465d]"}`}>
                  {anchorCount} dòng
                </span>
              </div>
              <textarea
                value={anchors}
                onChange={e => setAnchors(e.target.value)}
                placeholder="Nhập anchor text, mỗi dòng 1 cái&#10;Ví dụ:&#10;Sản phẩm A&#10;Dịch vụ B&#10;Công ty C"
                className="w-full h-80 bg-[#0b0e11] border border-[#2b3139] rounded-lg px-3 py-2 text-xs text-[#eaecef] placeholder-[#848e9c] focus:outline-none focus:border-[#fcd535]/50 font-mono resize-none"
              />
            </div>

            {/* URLs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#eaecef]">Target URL</label>
                <span className={`text-xs font-mono ${countMatch ? "text-[#0ecb81]" : "text-[#f6465d]"}`}>
                  {urlCount} dòng
                </span>
              </div>
              <textarea
                value={urls}
                onChange={e => setUrls(e.target.value)}
                placeholder="Nhập URL, mỗi dòng 1 cái&#10;Ví dụ:&#10;https://example.com/a&#10;https://example.com/b&#10;https://example.com/c"
                className="w-full h-80 bg-[#0b0e11] border border-[#2b3139] rounded-lg px-3 py-2 text-xs text-[#eaecef] placeholder-[#848e9c] focus:outline-none focus:border-[#fcd535]/50 font-mono resize-none"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 bg-[#f6465d]/10 border border-[#f6465d]/20 rounded-lg p-3">
              <AlertCircle size={14} className="text-[#f6465d] mt-0.5 flex-shrink-0" />
              <p className="text-xs text-[#f6465d]">{error}</p>
            </div>
          )}

          {/* Count Warning */}
          {!countMatch && anchorCount > 0 && urlCount > 0 && (
            <div className="flex items-start gap-2 bg-[#f0b90b]/10 border border-[#f0b90b]/20 rounded-lg p-3">
              <AlertCircle size={14} className="text-[#f0b90b] mt-0.5 flex-shrink-0" />
              <p className="text-xs text-[#f0b90b]">Số lượng không khớp: {anchorCount} anchor ≠ {urlCount} URL</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#2b3139] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-[#848e9c] bg-[#1e2329] border border-[#2b3139] rounded-lg hover:border-[#474d57] transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={!countMatch || anchorCount === 0 || saving}
            className="flex items-center gap-1.5 px-4 py-2 text-xs text-[#0b0e11] bg-gradient-to-r from-[#fcd535] to-[#f0b90b] rounded-lg font-medium hover:from-[#f0b90b] hover:to-[#fcd535] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save size={12} />
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  )
}
