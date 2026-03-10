import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        orders: {
          include: {
            orderItems: {
              include: {
                entries: true,
              },
            },
          },
        },
      },
    } as any)

    const customersWithStats = customers.map((customer: any) => ({
      ...customer,
      totalOrders: customer.orders.length,
      totalRevenue: customer.orders
        .filter((order: any) => order.paymentStatus === "PAID")
        .reduce((sum: number, order: any) => {
          // Calculate subtotal: sum of (unitPrice × entries.length)
          const subtotal = order.orderItems.reduce((s: number, item: any) => {
            const entriesCount = item.entries?.length ?? 1
            return s + (item.unitPrice * entriesCount)
          }, 0)
          // Apply discount
          const discount = order.discount ?? 0
          const orderTotal = subtotal * (1 - discount / 100)
          return sum + orderTotal
        }, 0),
    }))

    return NextResponse.json(customersWithStats)
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { telegramUsername, name, note } = body

    // Check duplicate telegramUsername (if provided)
    if (telegramUsername) {
      const existingByTelegram = await prisma.customer.findFirst({
        where: { telegramUsername },
      })
      if (existingByTelegram) {
        return NextResponse.json(
          { error: `Telegram @${telegramUsername} đã được dùng bởi "${existingByTelegram.name}"` },
          { status: 400 }
        )
      }
    }

    const customer = await prisma.customer.create({
      data: {
        telegramUsername,
        name: name || null,
        note: note || null,
      },
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error: any) {
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json({ error: `Tên khách hàng "${name}" đã tồn tại` }, { status: 400 })
    }
    console.error("POST /api/customers error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
