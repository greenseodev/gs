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
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          include: {
            orderItems: {
              include: {
                website: true,
              },
            },
          },
        },
      },
    })

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    return NextResponse.json(customer)
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
    const { telegramUsername, name, note } = body
    const { id } = await params

    // Check duplicate telegramUsername (if provided and changed)
    if (telegramUsername) {
      const existingByTelegram = await prisma.customer.findFirst({
        where: {
          telegramUsername,
          NOT: { id },
        },
      })
      if (existingByTelegram) {
        return NextResponse.json(
          { error: `Telegram @${telegramUsername} đã được dùng bởi "${existingByTelegram.name}"` },
          { status: 400 }
        )
      }
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...(telegramUsername !== undefined && { telegramUsername }),
        ...(name !== undefined && { name: name || null }),
        ...(note !== undefined && { note: note || null }),
      },
    })

    return NextResponse.json(customer)
  } catch (error: any) {
    // Handle unique constraint violation for name
    if (error.code === 'P2002') {
      return NextResponse.json({ error: `Tên khách hàng "${name}" đã tồn tại` }, { status: 400 })
    }
    console.error("PATCH /api/customers/[id] error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
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
    await prisma.customer.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
