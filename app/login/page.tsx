"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Lock, Mail } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const result = await signIn("credentials", { email, password, redirect: false })
      if (result?.error) setError("Email hoặc mật khẩu không đúng")
      else { router.push("/"); router.refresh() }
    } catch {
      setError("Đã xảy ra lỗi. Vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0e11]">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#fcd535]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-[#fcd535] to-[#f0b90b] rounded-2xl flex items-center justify-center shadow-2xl mx-auto mb-4 glow-primary">
            <span className="text-[#0b0e11] font-black text-xl">G</span>
          </div>
          <h1 className="text-xl font-bold text-[#eaecef]">GreenSEO</h1>
          <p className="text-xs text-[#848e9c] mt-1">Textlink Manager</p>
        </div>

        {/* Card */}
        <div className="bg-[#181a20] border border-[#2b3139] rounded-2xl p-7 shadow-2xl">
          <h2 className="text-base font-bold text-[#eaecef] mb-5">Đăng nhập</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#848e9c] mb-1.5">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#474d57]" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="email@example.com"
                  className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-lg pl-9 pr-4 py-2.5 text-sm text-[#eaecef] placeholder-[#474d57] focus:outline-none focus:border-[#fcd535]/50 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#848e9c] mb-1.5">Mật khẩu</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#474d57]" />
                <input
                  type={showPassword ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                  className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-lg pl-9 pr-10 py-2.5 text-sm text-[#eaecef] placeholder-[#474d57] focus:outline-none focus:border-[#fcd535]/50 transition-colors"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#474d57] hover:text-[#848e9c] transition-colors">
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-[#f6465d]/10 border border-[#f6465d]/20 text-[#f6465d] text-xs px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-[#fcd535] to-[#f0b90b] text-[#0b0e11] font-bold py-2.5 rounded-lg transition-all hover:from-[#f0b90b] hover:to-[#fcd535] disabled:opacity-50 disabled:cursor-not-allowed glow-primary text-sm mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-[#0b0e11]/30 border-t-[#0b0e11] rounded-full animate-spin" />
                  Đang đăng nhập...
                </span>
              ) : "Đăng nhập"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}