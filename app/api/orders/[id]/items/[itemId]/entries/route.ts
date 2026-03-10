import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: orderId, itemId } = await params
    const body = await request.json()
    const { entries } = body

    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ error: "Entries must be a non-empty array" }, { status: 400 })
    }

    // Verify orderItem exists and belongs to the order
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        id: itemId,
        orderId: orderId,
      },
    })

    if (!orderItem) {
      return NextResponse.json({ error: "Order item not found" }, { status: 404 })
    }

    // Delete all existing entries and create new ones in a transaction
    await prisma.$transaction([
      prisma.textlinkEntry.deleteMany({
        where: { orderItemId: itemId },
      }),
      prisma.textlinkEntry.createMany({
        data: entries.map((entry: any, idx: number) => ({
          orderItemId: itemId,
          anchorText: entry.anchorText,
          targetUrl: entry.targetUrl,
          position: entry.position ?? idx,
        })),
      }),
    ])

    // Fetch updated orderItem with new entries
    const updatedItem = await prisma.orderItem.findUnique({
      where: { id: itemId },
      include: {
        entries: {
          orderBy: { position: "asc" },
        },
      },
    })

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error("PUT /api/orders/[id]/items/[itemId]/entries error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
