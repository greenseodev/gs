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
    const paymentStatus = searchParams.get("paymentStatus")

    const orders = await prisma.order.findMany({
      where: paymentStatus ? { paymentStatus: paymentStatus as any } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        orderItems: {
          include: {
            website: true,
            entries: {
              orderBy: { position: "asc" },
            },
          },
        },
      },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error("GET /api/orders error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { customerId, items, paymentStatus, discount } = body

    // Validate discount
    if (discount < 0 || discount > 100) {
      return NextResponse.json({ error: "Discount phải từ 0 đến 100" }, { status: 400 })
    }

    // Validate endDate > startDate for each item
    for (const item of items) {
      const startDate = new Date(item.startDate)
      const endDate = new Date(item.endDate)
      if (endDate <= startDate) {
        return NextResponse.json({ error: "endDate phải sau startDate" }, { status: 400 })
      }
    }

    // Create order with items and entries
    const order = await prisma.order.create({
      data: {
        customerId,
        paymentStatus: paymentStatus || "ORDERED",
        discount: discount || 0,
        orderItems: {
          create: items.map((item: any) => ({
            websiteId: item.websiteId,
            type: item.textlinkType || item.type,
            duration: item.duration,
            unitPrice: item.unitPrice,
            startDate: new Date(item.startDate),
            endDate: new Date(item.endDate),
            status: "ACTIVE",
            entries: {
              create: (item.entries || []).map((entry: any) => ({
                anchorText: entry.anchorText,
                targetUrl: entry.targetUrl,
                position: entry.position || 0,
              })),
            },
          })),
        },
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

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error("POST /api/orders error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
