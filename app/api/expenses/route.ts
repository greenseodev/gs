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
    const category = searchParams.get("category")
    const month = searchParams.get("month")

    const where: any = {}

    if (category && category !== "ALL") {
      where.category = category
    }

    if (month) {
      const [year, monthNum] = month.split("-")
      const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
      const nextMonthStart = new Date(parseInt(year), parseInt(monthNum), 1)
      where.date = {
        gte: startDate,
        lt: nextMonthStart,
      }
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
    })

    return NextResponse.json(expenses)
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
    const { category, amount, note, date } = body

    const expense = await prisma.expense.create({
      data: {
        category,
        amount: parseFloat(amount),
        note: note || null,
        date: date ? new Date(date) : new Date(),
      },
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
