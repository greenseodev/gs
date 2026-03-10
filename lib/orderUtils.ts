import { OrderItemStatus, Duration } from "@prisma/client"

/**
 * Calculate endDate from startDate and duration
 */
export function calculateEndDate(startDate: Date | string, duration: Duration): Date {
  const end = new Date(startDate)
  const months = duration === "ONE_MONTH" ? 1 : 3
  end.setMonth(end.getMonth() + months)
  return end
}

/**
 * Calculate display status based on startDate and endDate
 * This ensures status is always accurate regardless of DB value
 */
export function getDisplayStatus(item: {
  startDate: Date | string
  endDate: Date | string
}): OrderItemStatus {
  const now = new Date()
  const start = new Date(item.startDate)
  const end = new Date(item.endDate)

  if (now > end) return "EXPIRED"
  if (now >= start) return "ACTIVE"
  return "PENDING"
}

/**
 * Calculate days remaining until endDate
 * Returns negative number if expired
 */
export function getDaysRemaining(endDate: Date | string): number {
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

/**
 * Check if OrderItem is expiring soon (within 7 days)
 */
export function isExpiringSoon(endDate: Date | string): boolean {
  const days = getDaysRemaining(endDate)
  return days > 0 && days <= 7
}

/**
 * Check if OrderItem is expired
 */
export function isExpired(endDate: Date | string): boolean {
  return getDaysRemaining(endDate) <= 0
}
