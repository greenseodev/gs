"use client"

import { useEffect, useState } from "react"
import { X, CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react"
import { toast as toastManager, Toast as ToastType } from "@/lib/toast"

const icons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const colors = {
  success: {
    icon: "text-[#0ecb81]",
    bg: "bg-[#0ecb81]",
    text: "text-[#0ecb81]",
  },
  error: {
    icon: "text-[#f6465d]",
    bg: "bg-[#f6465d]",
    text: "text-[#f6465d]",
  },
  warning: {
    icon: "text-[#f0b90b]",
    bg: "bg-[#f0b90b]",
    text: "text-[#f0b90b]",
  },
  info: {
    icon: "text-[#5b8def]",
    bg: "bg-[#5b8def]",
    text: "text-[#5b8def]",
  },
}

function ToastItem({ toast, onRemove }: { toast: ToastType; onRemove: (id: string) => void }) {
  const [isExiting, setIsExiting] = useState(false)
  const Icon = icons[toast.type]
  const color = colors[toast.type]

  const handleRemove = () => {
    setIsExiting(true)
    setTimeout(() => {
      onRemove(toast.id)
    }, 150)
  }

  return (
    <div
      className={`
        flex items-center gap-2.5
        bg-[#181a20]/95 backdrop-blur-sm
        border border-[#2b3139]
        rounded-lg px-3 py-2.5
        shadow-2xl
        min-w-70 max-w-95
        transition-all duration-150 ease-out
        ${isExiting
          ? "opacity-0 translate-x-4 scale-95"
          : "opacity-100 translate-x-0 scale-100 animate-slide-left"
        }
      `}
    >
      {/* Icon */}
      <div className="shrink-0">
        <Icon size={16} className={color.icon} strokeWidth={2.5} />
      </div>

      {/* Message */}
      <p className="text-xs text-[#eaecef] flex-1 leading-relaxed font-medium">
        {toast.message}
      </p>

      {/* Close button */}
      <button
        onClick={handleRemove}
        className="shrink-0 text-[#848e9c] hover:text-[#eaecef] transition-colors p-0.5 hover:bg-[#2b3139] rounded"
      >
        <X size={14} strokeWidth={2} />
      </button>
    </div>
  )
}

export default function ToastProvider() {
  const [toasts, setToasts] = useState<ToastType[]>([])

  useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToasts)
    return unsubscribe
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-5 right-5 z-9999 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onRemove={toastManager.remove.bind(toastManager)} />
        </div>
      ))}
    </div>
  )
}
