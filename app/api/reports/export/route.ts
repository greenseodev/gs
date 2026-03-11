import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import ExcelJS from "exceljs"

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
    let periodLabel: string

    if (period === "month" && year && month) {
      startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)
      periodLabel = `Tháng ${month}/${year}`
    } else if (period === "quarter" && year && quarter) {
      const quarterNum = parseInt(quarter)
      const startMonth = (quarterNum - 1) * 3
      startDate = new Date(parseInt(year), startMonth, 1)
      endDate = new Date(parseInt(year), startMonth + 3, 0, 23, 59, 59)
      periodLabel = `Quý ${quarter}/${year}`
    } else if (period === "year" && year) {
      startDate = new Date(parseInt(year), 0, 1)
      endDate = new Date(parseInt(year), 11, 31, 23, 59, 59)
      periodLabel = `Năm ${year}`
    } else {
      const now = new Date()
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      periodLabel = `Tháng ${now.getMonth() + 1}/${now.getFullYear()}`
    }

    // Fetch data
    const paidOrders = await prisma.order.findMany({
      where: {
        paymentStatus: "PAID",
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        customer: true,
        orderItems: {
          include: {
            website: true,
            entries: true,
          },
        },
      },
    })

    const expenses = await prisma.expense.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
      },
    })

    const totalRevenue = paidOrders.reduce((sum, o) => {
      const subtotal = o.orderItems.reduce((s, item) => {
        const entriesCount = (item as any).entries?.length ?? 1
        return s + (item.unitPrice * entriesCount)
      }, 0)
      const discount = (o as any).discount ?? 0
      const orderTotal = subtotal * (1 - discount / 100)
      return sum + orderTotal
    }, 0)
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

    // Create workbook
    const workbook = new ExcelJS.Workbook()
    workbook.creator = "GreenSEO Textlink Manager"
    workbook.created = new Date()

    // Summary sheet
    const summarySheet = workbook.addWorksheet("Tổng quan")
    summarySheet.columns = [
      { header: "Chỉ tiêu", key: "metric", width: 30 },
      { header: "Giá trị (USDT)", key: "value", width: 20 },
    ]

    summarySheet.addRows([
      { metric: "Kỳ báo cáo", value: periodLabel },
      { metric: "Tổng doanh thu", value: totalRevenue.toFixed(2) },
      { metric: "Tổng chi phí", value: totalExpenses.toFixed(2) },
      { metric: "Lợi nhuận ròng", value: (totalRevenue - totalExpenses).toFixed(2) },
    ])

    // Revenue sheet
    const revenueSheet = workbook.addWorksheet("Doanh thu")
    revenueSheet.columns = [
      { header: "Mã đơn", key: "orderId", width: 20 },
      { header: "Khách hàng", key: "customer", width: 25 },
      { header: "Ngày", key: "date", width: 15 },
      { header: "Số tiền (USDT)", key: "amount", width: 20 },
    ]

    paidOrders.forEach((order) => {
      const subtotal = order.orderItems.reduce((s, item) => {
        const entriesCount = (item as any).entries?.length ?? 1
        return s + (item.unitPrice * entriesCount)
      }, 0)
      const discount = (order as any).discount ?? 0
      const orderTotal = subtotal * (1 - discount / 100)
      revenueSheet.addRow({
        orderId: order.id.slice(0, 8),
        customer: order.customer.name || order.customer.telegramUsername,
        date: order.createdAt.toLocaleDateString("vi-VN"),
        amount: orderTotal.toFixed(2),
      })
    })

    // Expenses sheet
    const expensesSheet = workbook.addWorksheet("Chi phí")
    expensesSheet.columns = [
      { header: "Ngày", key: "date", width: 15 },
      { header: "Danh mục", key: "category", width: 20 },
      { header: "Số tiền (USDT)", key: "amount", width: 20 },
      { header: "Ghi chú", key: "note", width: 40 },
    ]

    expenses.forEach((expense) => {
      expensesSheet.addRow({
        date: expense.date.toLocaleDateString("vi-VN"),
        category: expense.category,
        amount: expense.amount.toFixed(2),
        note: expense.note || "",
      })
    })

    // Style headers
    ;[summarySheet, revenueSheet, expensesSheet].forEach((sheet) => {
      sheet.getRow(1).font = { bold: true }
      sheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0d9488" },
      }
      sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } }
    })

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer()

    // Return file
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="BaoCao_${periodLabel.replace(/\//g, "-")}.xlsx"`,
      },
    })
  } catch (error) {
    console.error("Error exporting report:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
