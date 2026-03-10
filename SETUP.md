# Hướng dẫn setup Textlink Manager

## Bước 1: Cài đặt PostgreSQL

### macOS (với Homebrew)
```bash
brew install postgresql@15
brew services start postgresql@15
```

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## Bước 2: Tạo database

```bash
# Kết nối vào PostgreSQL
sudo -u postgres psql

# Tạo database và user
CREATE DATABASE textlink_manager;
CREATE USER textlink_user WITH PASSWORD 'your_password_here';
GRANT ALL PRIVILEGES ON DATABASE textlink_manager TO textlink_user;
\q
```

## Bước 3: Cấu hình file .env

Sao chép file `.env.example` sang `.env`:
```bash
cp .env.example .env
```

Chỉnh sửa file `.env` với thông tin database của bạn:
```
DATABASE_URL="postgresql://textlink_user:your_password_here@localhost:5432/textlink_manager?schema=public"
NEXTAUTH_SECRET="thay-doi-cai-nay-thanh-random-string-dai"
NEXTAUTH_URL="http://localhost:3000"
```

**Lưu ý**: Tạo NEXTAUTH_SECRET bằng cách chạy:
```bash
openssl rand -base64 32
```

## Bước 4: Cài đặt dependencies

```bash
npm install
```

## Bước 5: Khởi tạo database

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed database với 2 user mặc định
npm run seed
```

Sau khi chạy seed, bạn sẽ có 2 user:
- **Email**: admin1@textlink.com - **Password**: 123456
- **Email**: admin2@textlink.com - **Password**: 123456

## Bước 6: Chạy development server

```bash
npm run dev
```

Mở trình duyệt và truy cập: http://localhost:3000

Đăng nhập bằng một trong 2 tài khoản phía trên.

## Troubleshooting

### Lỗi kết nối database
- Kiểm tra PostgreSQL đã chạy chưa: `sudo systemctl status postgresql`
- Kiểm tra DATABASE_URL trong file .env
- Thử kết nối thủ công: `psql -U textlink_user -d textlink_manager -h localhost`

### Lỗi Prisma
- Xóa folder `node_modules/.prisma` và chạy lại `npx prisma generate`
- Reset database: `npx prisma db push --force-reset`

### Port 3000 đã bị sử dụng
Chạy trên port khác:
```bash
PORT=3001 npm run dev
```

## Build Production

```bash
npm run build
npm start
```

## Deploy lên VPS

Xem file [README.md](README.md) để biết hướng dẫn chi tiết.
