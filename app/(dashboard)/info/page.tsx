"use client"

import {
  Info, CalendarDays, DollarSign, TrendingUp, Link2,
  Globe, Users, ShoppingCart, BarChart3, RefreshCw,
  AlertTriangle, CheckCircle2, Clock, Zap,
} from "lucide-react"

function Section({ title, icon: Icon, color, children }: {
  title: string; icon: any; color: string; children: React.ReactNode
}) {
  return (
    <div className="bg-[#181a20] border border-[#2b3139] rounded-xl overflow-hidden">
      <div className={`px-5 py-3.5 border-b border-[#2b3139] flex items-center gap-2.5 bg-gradient-to-r ${color}`}>
        <Icon size={15} className="text-white flex-shrink-0" />
        <h2 className="text-sm font-bold text-white">{title}</h2>
      </div>
      <div className="px-5 py-4 space-y-3">{children}</div>
    </div>
  )
}

function Row({ icon: Icon, label, desc, accent = "#848e9c" }: {
  icon: any; label: string; desc: string; accent?: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: `${accent}20` }}>
        <Icon size={13} style={{ color: accent }} />
      </div>
      <div>
        <p className="text-xs font-semibold text-[#eaecef]">{label}</p>
        <p className="text-xs text-[#848e9c] mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

function Note({ type, children }: { type: "info" | "warn" | "success"; children: React.ReactNode }) {
  const cfg = {
    info:    { icon: Info,          color: "#5b8def", bg: "bg-[#5b8def]/10 border-[#5b8def]/20" },
    warn:    { icon: AlertTriangle, color: "#f0b90b", bg: "bg-[#f0b90b]/10 border-[#f0b90b]/20" },
    success: { icon: CheckCircle2,  color: "#0ecb81", bg: "bg-[#0ecb81]/10 border-[#0ecb81]/20" },
  }[type]
  return (
    <div className={`flex items-start gap-2.5 px-3.5 py-3 rounded-lg border ${cfg.bg}`}>
      <cfg.icon size={13} style={{ color: cfg.color }} className="flex-shrink-0 mt-0.5" />
      <p className="text-xs leading-relaxed" style={{ color: cfg.color }}>{children}</p>
    </div>
  )
}

export default function InfoPage() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#eaecef]">Thông tin Hệ thống</h1>
        <p className="text-xs text-[#848e9c] mt-0.5">Hướng dẫn sử dụng và quy tắc tính toán của GreenSEO Textlink Manager</p>
      </div>

      {/* Quy tắc quan trọng nhất */}
      <div className="bg-gradient-to-r from-[#fcd535]/10 to-[#f0b90b]/10 border border-[#fcd535]/30 rounded-xl px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 bg-[#fcd535] rounded-lg flex items-center justify-center">
            <CalendarDays size={14} className="text-[#0b0e11]" />
          </div>
          <h2 className="text-sm font-bold text-[#fcd535]">Quy tắc tính doanh thu & chi phí</h2>
        </div>
        <p className="text-sm text-[#eaecef] leading-relaxed mb-3">
          Hệ thống tính doanh thu và chi phí <span className="font-bold text-[#fcd535]">bắt đầu từ tháng 03/2026</span>.
          Các đơn hàng hoặc chi phí trước thời điểm này không được phản ánh trong báo cáo tháng.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
          <Note type="success">
            <strong>Doanh thu</strong> được tính theo <strong>startDate</strong> của textlink — ngày dịch vụ bắt đầu chạy, không phải ngày tạo đơn trên hệ thống.
          </Note>
          <Note type="info">
            <strong>Chi phí</strong> được tính theo <strong>ngày nhập</strong> của khoản chi — đảm bảo khớp với thời điểm thực tế phát sinh chi phí.
          </Note>
        </div>
      </div>

      {/* Logic doanh thu */}
      <Section title="Logic tính Doanh thu" icon={TrendingUp} color="from-[#0ecb81]/30 to-[#0ecb81]/10">
        <Row icon={CheckCircle2} label="Chỉ tính đơn PAID" accent="#0ecb81"
          desc="Dashboard và báo cáo chỉ tổng hợp doanh thu từ các đơn có trạng thái 'Đã thanh toán'. Đơn Đã đặt / Chưa thanh toán / Công nợ không được tính vào doanh thu." />
        <Row icon={CalendarDays} label="Doanh thu theo startDate" accent="#0ecb81"
          desc="Một đơn hàng được tính vào tháng nào dựa theo startDate của orderItem — ngày textlink bắt đầu chạy. Ví dụ: đơn tạo ngày 3/4 nhưng startDate là 28/3 thì doanh thu tính vào tháng 3." />
        <Row icon={DollarSign} label="Công thức tính tiền" accent="#0ecb81"
          desc="Tổng đơn = Σ(unitPrice × số entries) × (1 − discount%). Mỗi item tính riêng biệt, discount áp dụng lên toàn đơn sau khi đã cộng tất cả items." />
        <Note type="warn">
          Nếu một đơn hàng có nhiều orderItem với startDate ở các tháng khác nhau, đơn đó sẽ xuất hiện trong doanh thu của cả hai tháng. Nên đặt cùng startDate cho tất cả items trong một đơn.
        </Note>
      </Section>

      {/* Logic textlink */}
      <Section title="Logic Trạng thái Textlink" icon={Link2} color="from-[#5b8def]/30 to-[#5b8def]/10">
        <Row icon={Clock} label="Trạng thái tính theo ngày thực tế" accent="#5b8def"
          desc="Dashboard tính textlink 'đang chạy' dựa trên startDate ≤ hôm nay ≤ endDate, thuộc đơn PAID — không dựa vào trường status lưu trong database vì trường đó có thể stale." />
        <Row icon={AlertTriangle} label="Cảnh báo sắp hết hạn" accent="#f0b90b"
          desc="Hệ thống cảnh báo các textlink có endDate trong vòng 7 ngày tới. Đây là danh sách ưu tiên để liên hệ gia hạn với khách hàng." />
        <Row icon={RefreshCw} label="Gia hạn tạo đơn mới" accent="#5b8def"
          desc="Chức năng gia hạn không cập nhật đơn cũ mà tạo một Order mới hoàn toàn. Giá gia hạn lấy theo bảng giá hiện tại của website, không giữ nguyên giá cũ." />
        <Note type="info">
          Dự báo gia hạn tháng tới trên Dashboard tính tổng doanh thu tiềm năng từ các textlink đang active có endDate rơi vào tháng tới. Đây là con số ước tính, giá thực tế phụ thuộc vào bảng giá tại thời điểm gia hạn.
        </Note>
      </Section>

      {/* Các module */}
      <Section title="Các module chính" icon={Zap} color="from-[#fcd535]/30 to-[#f0b90b]/10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {[
            { icon: Globe, label: "Website", accent: "#fcd535",
              desc: "Quản lý portfolio website SEO. Mỗi website có bảng giá riêng theo loại (Footer/Homepage) và thời hạn (1T/3T). Mua website tự động tạo khoản chi phí WEBSITE_PURCHASE." },
            { icon: ShoppingCart, label: "Đơn hàng", accent: "#0ecb81",
              desc: "Tạo đơn qua wizard 3 bước: chọn khách → chọn website + nhập anchor/URL → xác nhận giá & ngày. Một đơn có thể chứa nhiều textlink trên nhiều website." },
            { icon: Users, label: "Khách hàng", accent: "#5b8def",
              desc: "Lưu thông tin khách, theo dõi tổng số đơn và doanh thu. Khách inactive (endDate cuối > 30 ngày, chưa có đơn mới) được đánh dấu trên Dashboard." },
            { icon: DollarSign, label: "Chi phí", accent: "#f6465d",
              desc: "Ghi nhận các khoản chi: mua website, VPS/hosting, gia hạn domain, chia sẻ đối tác, khác. Lọc được theo danh mục và tháng." },
            { icon: BarChart3, label: "Báo cáo", accent: "#f0b90b",
              desc: "P&L theo tháng/quý/năm với breakdown theo website và khách hàng. Xuất file Excel 3 sheets: tổng quan, doanh thu, chi phí." },
          ].map((item, i) => (
            <Row key={i} icon={item.icon} label={item.label} accent={item.accent} desc={item.desc} />
          ))}
        </div>
      </Section>

      {/* Footer */}
      <div className="text-center py-4 text-xs text-[#474d57]">
        GreenSEO Textlink Manager · Phiên bản nội bộ · Dữ liệu được lưu trữ cục bộ trên PostgreSQL
      </div>
    </div>
  )
}
