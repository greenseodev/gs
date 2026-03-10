"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useState } from "react"
import {
  LayoutDashboard, Globe, ShoppingCart,
  Users, DollarSign, BarChart3, LogOut,
  ChevronLeft, ChevronRight,
} from "lucide-react"

const menuItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Website", href: "/websites", icon: Globe },
  { name: "Đơn hàng", href: "/orders", icon: ShoppingCart },
  { name: "Khách hàng", href: "/customers", icon: Users },
  { name: "Chi phí", href: "/expenses", icon: DollarSign },
  { name: "Báo cáo", href: "/reports", icon: BarChart3 },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-[#181a20] border-r border-[#2b3139] flex flex-col shadow-2xl z-50 transition-all duration-300 ease-in-out ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        {/* Logo */}
        <div className={`border-b border-[#2b3139] flex items-center ${collapsed ? "px-4 py-5 justify-center" : "px-6 py-5"}`}>
          <div className="w-8 h-8 bg-gradient-to-br from-[#fcd535] to-[#f0b90b] rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
            <span className="text-[#0b0e11] font-bold text-sm">G</span>
          </div>
          {!collapsed && (
            <div className="ml-2 overflow-hidden">
              <h1 className="text-base font-bold text-[#eaecef] leading-none whitespace-nowrap">GreenSEO</h1>
              <p className="text-xs text-[#848e9c] mt-0.5 whitespace-nowrap">Textlink Manager</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.name : undefined}
                className={`
                  flex items-center rounded-lg transition-all duration-150 text-sm font-medium
                  ${collapsed ? "px-0 py-2.5 justify-center" : "px-3 py-2.5 gap-3"}
                  ${isActive
                    ? "bg-gradient-to-r from-[#fcd535] to-[#f0b90b] text-[#0b0e11] shadow-lg glow-primary"
                    : "text-[#b7bdc6] hover:bg-[#1e2329] hover:text-[#fcd535]"
                  }
                `}
              >
                <Icon size={18} className={`flex-shrink-0 ${isActive ? "text-[#0b0e11]" : ""}`} />
                {!collapsed && <span className="whitespace-nowrap overflow-hidden">{item.name}</span>}
                {!collapsed && isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0b0e11] opacity-70 flex-shrink-0" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="px-2 py-4 border-t border-[#2b3139]">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title={collapsed ? "Đăng xuất" : undefined}
            className={`flex items-center rounded-lg text-[#b7bdc6] hover:bg-[#f6465d]/10 hover:text-[#f6465d] transition-all duration-150 w-full text-sm font-medium group
              ${collapsed ? "px-0 py-2.5 justify-center" : "px-3 py-2.5 gap-3"}
            `}
          >
            <LogOut size={18} className="flex-shrink-0 group-hover:text-[#f6465d]" />
            {!collapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={`fixed top-6 z-[60] w-5 h-5 bg-[#2b3139] hover:bg-[#474d57] border border-[#474d57] rounded-full flex items-center justify-center transition-all duration-300 ease-in-out`}
        style={{ left: collapsed ? "52px" : "228px" }}
      >
        {collapsed
          ? <ChevronRight size={11} className="text-[#848e9c]" />
          : <ChevronLeft size={11} className="text-[#848e9c]" />
        }
      </button>

      {/* Placeholder div để giữ chỗ cho layout */}
      <div
        className="flex-shrink-0 transition-all duration-300 ease-in-out"
        style={{ width: collapsed ? "64px" : "240px" }}
      />
    </>
  )
}