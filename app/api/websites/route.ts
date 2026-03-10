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

    const websites = await prisma.website.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        textlinkPrices: {
          orderBy: { effectiveFrom: "desc" },
          take: 4,
        },
      },
    })

    return NextResponse.json(websites)
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
    const { domain, dr, traffic, buyPrice, purchaseDate, wpUrl, wpUsername, wpPassword } = body

    const parsedBuyPrice = parseFloat(buyPrice)
    const parsedPurchaseDate = purchaseDate ? new Date(purchaseDate) : new Date()

    // Create website and expense in transaction
    const [website, _expense] = await prisma.$transaction([
      prisma.website.create({
        data: {
          domain,
          dr: parseInt(dr),
          traffic: parseInt(traffic),
          buyPrice: parsedBuyPrice,
          purchaseDate: parsedPurchaseDate,
          wpUrl: wpUrl || null,
          wpUsername: wpUsername || null,
          wpPassword: wpPassword || null,
        },
      }),
      prisma.expense.create({
        data: {
          category: "WEBSITE_PURCHASE",
          amount: parsedBuyPrice,
          date: parsedPurchaseDate,
          note: `Mua website: ${domain}`,
        },
      }),
    ])

    return NextResponse.json(website, { status: 201 })
  } catch (error) {
    console.error("POST /api/websites error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
