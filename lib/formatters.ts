import { Duration, TextlinkType, PaymentStatus } from "@prisma/client"

/**
 * Format duration as Vietnamese text
 * @example formatDuration("ONE_MONTH") => "1 tháng"
 */
export function formatDuration(duration: Duration): string {
  return duration === "ONE_MONTH" ? "1 tháng" : "3 tháng"
}

/**
 * Format duration as short Vietnamese text
 * @example formatDurationShort("ONE_MONTH") => "1T"
 */
export function formatDurationShort(duration: Duration): string {
  return duration === "ONE_MONTH" ? "1T" : "3T"
}

/**
 * Format textlink type as Vietnamese text
 * @example formatType("FOOTER") => "Footer"
 */
export function formatType(type: TextlinkType): string {
  return type === "FOOTER" ? "Footer" : "Homepage"
}

/**
 * Format payment status as Vietnamese text with colors
 */
export function formatPaymentStatus(status: PaymentStatus): {
  label: string
  text: string
  bg: string
  border: string
} {
  switch (status) {
    case "ORDERED":
      return {
        label: "Đã đặt",
        text: "text-[#f0b90b]",
        bg: "bg-[#f0b90b]/10",
        border: "border-[#f0b90b]/20"
      }
    case "PAID":
      return {
        label: "Đã thanh toán",
        text: "text-[#0ecb81]",
        bg: "bg-[#0ecb81]/10",
        border: "border-[#0ecb81]/20"
      }
    case "UNPAID":
      return {
        label: "Chưa thanh toán",
        text: "text-[#5b8def]",
        bg: "bg-[#5b8def]/10",
        border: "border-[#5b8def]/20"
      }
    case "DEBT":
      return {
        label: "Công nợ",
        text: "text-[#f6465d]",
        bg: "bg-[#f6465d]/10",
        border: "border-[#f6465d]/20"
      }
    default:
      return {
        label: status,
        text: "text-[#848e9c]",
        bg: "bg-[#848e9c]/10",
        border: "border-[#848e9c]/20"
      }
  }
}

/**
 * Format currency as USDT (always 2 decimal places)
 * @example formatCurrency(100) => "$100.00 USDT"
 */
export function formatCurrency(amount: number): string {
  const formatted = Number.isInteger(amount)
    ? amount.toString()
    : amount.toFixed(2)
  return `$${formatted} USDT`
}

/**
 * Format date as Vietnamese short format
 * @example formatDate("2024-01-15") => "15/01/2024"
 */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("vi-VN")
}

/**
 * Format date for HTML input type="date" (YYYY-MM-DD)
 * @example formatDateInput(new Date("2024-01-15")) => "2024-01-15"
 */
export function formatDateInput(date: Date | string): string {
  const d = new Date(date)

  // Check if date is valid
  if (isNaN(d.getTime())) {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Format date and time as Vietnamese format
 * @example formatDateTime("2024-01-15T10:30") => "15/01/2024, 10:30:00"
 */
export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("vi-VN")
}

/**
 * Calculate order subtotal (before discount)
 * @param items Array of order items with unitPrice and entries
 */
export function calcOrderSubtotal(items: Array<{ unitPrice: number; entries?: Array<any> | null }>): number {
  return items.reduce((sum, item) => {
    const entriesCount = item.entries?.length ?? 1
    return sum + (item.unitPrice * entriesCount)
  }, 0)
}

/**
 * Calculate order total (after discount)
 * @param items Array of order items with unitPrice and entries
 * @param discount Discount percentage (0-100)
 */
export function calcOrderTotal(
  items: Array<{ unitPrice: number; entries?: Array<any> | null }>,
  discount: number = 0
): number {
  const subtotal = calcOrderSubtotal(items)
  return subtotal * (1 - discount / 100)
}

/**
 * Calculate single item total
 * @param unitPrice Price per entry
 * @param entriesCount Number of entries
 */
export function calcItemTotal(unitPrice: number, entriesCount: number): number {
  return unitPrice * entriesCount
}
