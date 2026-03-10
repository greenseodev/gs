# Quick Start Guide

## Bước 1: Cài đặt PostgreSQL (nếu chưa có)

```bash
# macOS
brew install postgresql@15
brew services start postgresql@15

# Ubuntu
sudo apt install postgresql
```

## Bước 2: Tạo database

```bash
# Kết nối PostgreSQL
psql postgres

# Tạo database
CREATE DATABASE textlink_manager;

# Thoát
\q
```

## Bước 3: Setup project

```bash
# Cài đặt dependencies
npm install

# Tạo file .env
cp .env.example .env

# Chỉnh sửa .env với thông tin database của bạn
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/textlink_manager?schema=public"
```

## Bước 4: Khởi tạo database

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed database với 2 users
npm run seed
```

Sau khi seed, bạn có 2 users:
- **admin1@textlink.com** / 123456
- **admin2@textlink.com** / 123456

## Bước 5: Chạy app

```bash
npm run dev
```

Mở http://localhost:3000 và đăng nhập!

## Xong! 🎉

Giờ bạn có thể:
- ✅ Đăng nhập với 2 tài khoản admin
- ✅ Xem Dashboard với thống kê
- ✅ Quản lý Website và giá textlink
- 🚧 Các module khác đang được phát triển (xem STATUS.md)

## Troubleshooting

**Lỗi kết nối database?**
```bash
# Kiểm tra PostgreSQL đang chạy
brew services list | grep postgresql  # macOS
sudo systemctl status postgresql      # Ubuntu
```

**Lỗi Prisma?**
```bash
# Xóa và tạo lại
rm -rf node_modules/.prisma
npx prisma generate
```

**Port 3000 đang dùng?**
```bash
PORT=3001 npm run dev
```
