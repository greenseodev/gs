# Textlink Manager - Hệ thống quản lý mua bán textlink

## Giới thiệu
Web app quản lý mua bán textlink nội bộ với 2 người dùng cùng quyền. Theo dõi website, đơn hàng, doanh thu, chi phí và lãi/lỗ.

## Tech Stack
- **Frontend**: Next.js 15 (App Router) + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js (email/password)
- **Icons**: Lucide React
- **Excel Export**: ExcelJS

## Cài đặt

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình database
Tạo file `.env` từ `.env.example` và cập nhật thông tin database PostgreSQL của bạn.

### 3. Chạy migration
```bash
npx prisma generate
npx prisma db push
```

### 4. Tạo user đầu tiên
Mở Prisma Studio để tạo user:
```bash
npx prisma studio
```

### 5. Chạy development server
```bash
npm run dev
```

Truy cập: http://localhost:3000

## Chức năng chính

### 1. Dashboard
- Tổng doanh thu (hôm nay, tuần, tháng, quý, năm)
- Tổng chi phí tháng
- Lãi ròng tháng
- Cảnh báo textlink sắp hết hạn (2 ngày)

### 2. Quản lý Website
- CRUD website (domain, DR, traffic, giá mua)
- Quản lý bảng giá textlink (footer/homepage × 1/3 tháng)
- Lịch sử thay đổi giá

### 3. Quản lý Khách hàng
- CRUD khách hàng
- Lịch sử đơn hàng
- Tổng doanh thu

### 4. Quản lý Đơn hàng
- Tạo đơn với nhiều textlink
- Trạng thái: Pending / Paid / Unpaid / Debt
- Gia hạn textlink

### 5. Quản lý Chi phí
- Các loại chi phí
- CRUD với ghi chú và ngày chi

### 6. Báo cáo
- Lãi/lỗ theo tháng
- Lãi/lỗ từng website
- Xuất Excel

## TODO
- [ ] Hoàn thiện các trang Customers, Orders, Expenses, Reports
- [ ] Script seed tạo user mặc định
- [ ] Tính năng xuất Excel
- [ ] Cron job cập nhật status textlink hết hạn
- [ ] Testing
