import type { Metadata } from "next"
import { Inter, IBM_Plex_Mono } from "next/font/google"
import "./globals.css"
import SessionProvider from "@/components/providers/SessionProvider"
import ToastProvider from "@/components/ui/Toast"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono"
})

export const metadata: Metadata = {
  title: "Textlink Manager - Quản lý mua bán textlink",
  description: "Hệ thống quản lý mua bán textlink nội bộ",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi">
      <body className={`${inter.variable} ${ibmPlexMono.variable}`}>
        <SessionProvider>{children}</SessionProvider>
        <ToastProvider />
      </body>
    </html>
  )
}
