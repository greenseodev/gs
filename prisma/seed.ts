import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import bcrypt from "bcryptjs"

const connectionString = process.env.DATABASE_URL!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const password = await bcrypt.hash("admin123", 10)

  await prisma.user.upsert({
    where: { email: "admin@xanhseo.com" },
    update: {},
    create: {
      email: "admin@xanhseo.com",
      password,
      name: "Peter"
    }
  })

  console.log("✅ Seed xong!")
  console.log("📧 Email: admin@xanhseo.com")
  console.log("🔑 Password: admin123")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
