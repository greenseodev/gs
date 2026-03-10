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
    const { type, duration, price, effectiveFrom } = body

    const { id } = await params
    const textlinkPrice = await prisma.textlinkPrice.create({
      data: {
        websiteId: id,
        type,
        duration,
        price: parseFloat(price),
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
      },
    })

    return NextResponse.json(textlinkPrice, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
