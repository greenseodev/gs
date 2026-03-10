import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "month"
    const year = searchParams.get("year")
    const month = searchParams.get("month")
    const quarter = searchParams.get("quarter")

    let startDate: Date
    let endDate: Date

    if (period === "month" && year && month) {
      startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)
    } else if (period === "quarter" && year && quarter) {
      const quarterNum = parseInt(quarter)
      const startMonth = (quarterNum - 1) * 3
      startDate = new Date(parseInt(year), startMonth, 1)
      endDate = new Date(parseInt(year), startMonth + 3, 0, 23, 59, 59)
    } else if (period === "year" && year) {
      startDate = new Date(parseInt(year), 0, 1)
      endDate = new Date(parseInt(year), 11, 31, 23, 59, 59)
    } else {
      const now = new Date()
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    }

    // Get revenue (only PAID orders)
    const paidOrders = await prisma.order.findMany({
      where: {
        paymentStatus: "PAID",
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        orderItems: {
          include: {
            website: true,
            entries: true as any,
          },
        },
      },
    } as any)

    const calculateOrderTotal = (order: any) => {
      const subtotal = order.orderItems.reduce((s: number, item: any) => {
        const entriesCount = item.entries?.length ?? 1
        return s + (item.unitPrice * entriesCount)
      }, 0)
      const discount = order.discount ?? 0
      return subtotal * (1 - discount / 100)
    }

    const totalRevenue = paidOrders.reduce(
      (sum, order) => sum + calculateOrderTotal(order),
      0
    )

    // Get expenses
    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)

    // Calculate profit/loss by website
    const websiteStats: Record<
      string,
      { domain: string; revenue: number; buyPrice: number; profit: number }
    > = {}

    for (const order of paidOrders) {
      const orderDiscount = (order as any).discount ?? 0
      for (const item of (order as any).orderItems) {
        const websiteId = item.website.id
        if (!websiteStats[websiteId]) {
          websiteStats[websiteId] = {
            domain: item.website.domain,
            revenue: 0,
            buyPrice: item.website.buyPrice,
            profit: 0,
          }
        }
        const entriesCount = item.entries?.length ?? 1
        const itemSubtotal = item.unitPrice * entriesCount
        const itemRevenue = itemSubtotal * (1 - orderDiscount / 100)
        websiteStats[websiteId].revenue += itemRevenue
      }
    }

    // Calculate profit for each website
    // Note: buyPrice is already accounted for in totalExpenses (via Expense table)
    // so we don't subtract it here again
    const websiteProfitLoss = Object.values(websiteStats).map((stats) => ({
      domain: stats.domain,
      revenue: stats.revenue,
      buyPrice: stats.buyPrice,
      profit: stats.revenue, // Revenue only (cost is in expenses)
    }))

    const netProfit = totalRevenue - totalExpenses

    return NextResponse.json({
      period: { startDate, endDate },
      totalRevenue,
      totalExpenses,
      netProfit,
      websiteProfitLoss,
      expensesByCategory: expenses.reduce((acc: any, exp) => {
        if (!acc[exp.category]) {
          acc[exp.category] = 0
        }
        acc[exp.category] += exp.amount
        return acc
      }, {}),
    })
  } catch (error) {
    console.error("Error generating report:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
