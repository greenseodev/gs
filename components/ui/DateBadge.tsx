import { Calendar } from "lucide-react"
import { formatDate } from "@/lib/formatters"

export function DateBadge({ date }: { date: string | Date }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#1e2329] border border-[#2b3139] rounded-md text-xs text-[#848e9c]">
      <Calendar size={11} className="flex-shrink-0" />
      {formatDate(date)}
    </span>
  )
}
