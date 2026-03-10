import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { itemIds, prices } = body

    const { id } = await params
    // Get the original order
    const originalOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        orderItems: {
          include: {
            website: {
              include: {
                textlinkPrices: {
                  orderBy: { effectiveFrom: "desc" },
                  take: 1,
                },
              },
            },
            entries: {
              orderBy: { position: "asc" },
            },
          },
        },
      },
    } as any)

    if (!originalOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Filter items to renew
    const itemsToRenew = (originalOrder as any).orderItems.filter((item: any) =>
      itemIds.includes(item.id)
    )

    // Create new order items with current prices or overridden prices
    const newItems = itemsToRenew.map((item: any) => {
      const overriddenPrice = prices?.[item.id]
      let unitPrice = overriddenPrice

      // If no override, get current price
      if (!overriddenPrice) {
        const currentPrice = item.website.textlinkPrices.find(
          (p: any) =>
            p.type === item.type && p.duration === item.duration
        )
        unitPrice = currentPrice?.price || item.unitPrice
      }

      // Calculate new dates based on duration
      const startDate = new Date()
      const endDate = new Date(startDate)
      const monthsToAdd = item.duration === "ONE_MONTH" ? 1 : 3
      endDate.setMonth(endDate.getMonth() + monthsToAdd)

      return {
        websiteId: item.websiteId,
        type: item.type,
        duration: item.duration,
        unitPrice,
        startDate,
        endDate,
        status: "ACTIVE" as const,
        entries: {
          create: (item.entries || []).map((entry: any, idx: number) => ({
            anchorText: entry.anchorText,
            targetUrl: entry.targetUrl,
            position: entry.position ?? idx,
          })),
        },
      }
    })

    // Create new order - copy discount from original order
    const newOrder = await prisma.order.create({
      data: {
        customerId: (originalOrder as any).customerId,
        paymentStatus: "ORDERED",
        discount: (originalOrder as any).discount ?? 0,
        orderItems: {
          create: newItems,
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
    } as any)

    return NextResponse.json(newOrder, { status: 201 })
  } catch (error) {
    console.error("Error renewing order:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
