import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const website = await prisma.website.findUnique({
      where: { id },
      include: {
        textlinkPrices: {
          orderBy: { effectiveFrom: "desc" },
        },
      },
    })

    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 })
    }

    return NextResponse.json(website)
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { domain, dr, traffic, buyPrice, purchaseDate, wpUrl, wpUsername, wpPassword } = body

    const { id } = await params
    const website = await prisma.website.update({
      where: { id },
      data: {
        ...(domain && { domain }),
        ...(dr !== undefined && { dr: parseInt(dr) }),
        ...(traffic !== undefined && { traffic: parseInt(traffic) }),
        ...(buyPrice !== undefined && { buyPrice: parseFloat(buyPrice) }),
        ...(purchaseDate && { purchaseDate: new Date(purchaseDate) }),
        ...(wpUrl !== undefined && { wpUrl: wpUrl || null }),
        ...(wpUsername !== undefined && { wpUsername: wpUsername || null }),
        ...(wpPassword !== undefined && { wpPassword: wpPassword || null }),
      },
    })

    return NextResponse.json(website)
  } catch (error) {
    console.error("PATCH /api/websites/[id] error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Kiểm tra có order items nào còn hiệu lực không (based on endDate)
    const relatedItems = await prisma.orderItem.findMany({
      where: { websiteId: id },
      select: { id: true, endDate: true }
    })

    // Check if any items are still active (endDate >= now)
    const now = new Date()
    const activeItems = relatedItems.filter(item => new Date(item.endDate) >= now)

    if (activeItems.length > 0) {
      const totalCount = relatedItems.length
      const activeCount = activeItems.length
      const expiredCount = totalCount - activeCount

      return NextResponse.json(
        {
          error: `Không thể xóa — website đang có ${activeCount} textlink còn hiệu lực` +
                 (expiredCount > 0 ? ` (${expiredCount} đã hết hạn)` : '')
        },
        { status: 400 }
      )
    }

    // All items expired or no items → allow deletion

    await prisma.website.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Website deleted" })
  } catch (error) {
    console.error("DELETE /api/websites/[id] error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
