# Cập nhật Logic Tính Tiền & Tính Năng Chiết Khấu

## Tóm tắt thay đổi

Đã sửa toàn bộ logic tính tiền trong hệ thống để tính đúng: **Giá 1 OrderItem = unitPrice × số lượng entries**

Thêm tính năng **chiết khấu theo %** cho mỗi đơn hàng.

---

## 1. Database Schema Changes

### File: `prisma/schema.prisma`

Đã thêm field `discount` vào model `Order`:

```prisma
model Order {
  id            String        @id @default(cuid())
  customerId    String
  paymentStatus PaymentStatus @default(ORDERED)
  discount      Float         @default(0) // % chiết khấu, ví dụ 10 = 10%
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  customer   Customer    @relation(fields: [customerId], references: [id], onDelete: Cascade)
  orderItems OrderItem[]

  @@index([customerId])
}
```

**Migration Required:**
```bash
npx prisma migrate dev --name add-discount-to-order
npx prisma generate
```

---

## 2. Logic Tính Tiền Mới

### Công thức:

```typescript
// Tính subtotal (trước chiết khấu)
subtotal = sum(orderItem.unitPrice × orderItem.entries.length)

// Tính discount amount
discountAmount = subtotal × (order.discount / 100)

// Tính total (sau chiết khấu)
total = subtotal - discountAmount
```

### Ví dụ:

- Website A: $30/link × 13 entries = $390
- Website B: $25/link × 7 entries = $175
- **Subtotal**: $565
- **Discount**: 10% = -$56.50
- **Total**: $508.50

---

## 3. API Changes

### `POST /api/orders` - Tạo đơn mới

**Request body mới:**
```json
{
  "customerId": "...",
  "discount": 10,  // % chiết khấu (optional, default 0)
  "items": [
    {
      "websiteId": "...",
      "type": "HOMEPAGE",
      "duration": "ONE_MONTH",
      "unitPrice": 30,
      "startDate": "2024-01-01",
      "endDate": "2024-02-01",
      "entries": [
        { "anchorText": "...", "targetUrl": "...", "position": 0 },
        { "anchorText": "...", "targetUrl": "...", "position": 1 }
      ]
    }
  ]
}
```

### `GET /api/orders` và `GET /api/orders/:id`

**Response đã bao gồm:**
- Field `discount` trong Order
- Field `entries` trong mỗi OrderItem

---

## 4. UI Changes

### 4.1. CreateOrderPage (`/orders/create`)

#### Bước 2 (Xác nhận) - Thêm Discount Selector:

- **5 nút preset**: 0%, 5%, 10%, 15%, 20%
- **Input tùy chỉnh**: Nhập % chiết khấu bất kỳ (0-100)

#### Sidebar Summary - Hiển thị rõ ràng:

```
Số gói: 2
Số links: 20

Website A (13): $390.00
Website B (7):  $175.00
────────────────────────
Tạm tính:      $565.00
Chiết khấu:    -$56.50 (10%)
────────────────────────
Tổng cộng:     $508.50
```

### 4.2. OrdersPage (`/orders`)

- Cột "Textlinks" hiện **số links thực tế** (tổng entries)
- Cột "Tổng tiền" tính **đúng theo entries × unitPrice - discount**

### 4.3. OrderDetail (`/orders/:id`)

**Sidebar hiện:**
```
Số gói / Số links: 2 / 20

Tạm tính:     $565.00
Chiết khấu:   -$56.50 (10%)
────────────────────────
Tổng cộng:    $508.50
```

**Mỗi OrderItem hiện giá:**
- Website A: **$390.00** (13 links × $30)

### 4.4. Dashboard (`/`)

**KPI Cards đã sửa:**
- Doanh thu tháng này
- Lãi ròng tháng này
- Tổng doanh thu all-time
- Chưa thu tiền

**Chart 6 tháng** tính đúng revenue với discount

**Top Websites & Top Customers** tính doanh thu đúng

**Đơn chưa thu tiền** hiện số links và total đúng

### 4.5. Reports Page (`/reports`)

API `/api/reports/profit-loss` tính:
- `totalRevenue` = tổng các order đã thanh toán (có tính discount & entries)
- `websiteProfitLoss` phân bổ doanh thu theo website

---

## 5. Files Changed

### Prisma Schema:
- ✅ `prisma/schema.prisma` - Added `discount` field

### API Routes:
- ✅ `app/api/orders/route.ts` - POST accepts `discount`, GET includes `entries`
- ✅ `app/api/orders/[id]/route.ts` - Includes `entries` in responses
- ✅ `app/api/reports/profit-loss/route.ts` - Fixed revenue calculation

### Pages:
- ✅ `app/(dashboard)/orders/create/page.tsx` - Discount UI, fixed total calc
- ✅ `app/(dashboard)/orders/page.tsx` - Fixed total calc & links count
- ✅ `app/(dashboard)/orders/[id]/page.tsx` - Shows breakdown with discount
- ✅ `app/(dashboard)/page.tsx` (Dashboard) - Fixed all KPIs, chart, stats
- ✅ `app/(dashboard)/websites/page.tsx` - Error handling for delete

### Components:
- No component changes needed

---

## 6. Migration Steps

### Bắt buộc chạy:

```bash
# 1. Generate migration
npx prisma migrate dev --name add-discount-to-order

# 2. Regenerate Prisma Client (QUAN TRỌNG!)
npx prisma generate

# 3. Restart dev server
npm run dev
```

**Lưu ý:** TypeScript sẽ báo lỗi `entries does not exist` cho đến khi bạn chạy `npx prisma generate`. Tôi đã thêm `as any` để bypass tạm thời.

---

## 7. Testing Checklist

### ✅ Test tạo đơn mới:
1. Tạo đơn với nhiều entries (ví dụ 13 links)
2. Chọn discount 10%
3. Kiểm tra sidebar hiện đúng: Subtotal → Discount → Total
4. Submit và kiểm tra DB có lưu `discount`

### ✅ Test hiển thị đơn:
1. Vào `/orders` - kiểm tra số links và tổng tiền đúng
2. Vào `/orders/:id` - kiểm tra breakdown hiện chiết khấu
3. Kiểm tra mỗi OrderItem hiện giá = unitPrice × entries.length

### ✅ Test Dashboard:
1. Kiểm tra "Doanh thu tháng này" tính đúng
2. Kiểm tra "Chưa thu tiền" hiện total đúng
3. Kiểm tra Chart 6 tháng
4. Kiểm tra Top Websites revenue

### ✅ Test Reports:
1. Vào `/reports`
2. Chọn period (month/quarter/year)
3. Kiểm tra Total Revenue tính đúng với discount

### ✅ Test DELETE website:
1. Thử xóa website đang có OrderItem ACTIVE → Hiện message rõ ràng
2. Thử xóa website không có OrderItem → Xóa thành công

---

## 8. Breaking Changes

### ⚠️ Dữ liệu cũ:

- Các Order cũ sẽ có `discount = 0` (default)
- Các OrderItem cũ có thể không có `entries` → fallback to `entries.length = 1`
- Logic đã handle backward compatibility

### ⚠️ API Response Changes:

- `GET /api/orders` giờ trả về `entries` array trong mỗi `orderItem`
- Frontend cũ sẽ bị sai nếu không update

---

## 9. Known Issues & Limitations

1. **TypeScript errors trước khi chạy `npx prisma generate`**:
   - Đã thêm `as any` để bypass
   - Phải chạy Prisma generate để fix

2. **Prisma client chưa có type cho `entries` relation**:
   - Runtime vẫn hoạt động bình thường
   - Type checking sẽ fixed sau khi generate

3. **Discount không phân bổ riêng cho từng OrderItem**:
   - Discount áp dụng cho toàn đơn
   - Nếu cần discount riêng từng item → cần thêm field `discount` vào OrderItem

---

## 10. Future Enhancements

- [ ] Thêm discount code system (coupon)
- [ ] Discount history tracking
- [ ] Discount per item thay vì per order
- [ ] Discount validation rules (min order value, max discount %)
- [ ] Export reports with discount breakdown

---

## Contact

Nếu có lỗi sau khi update, kiểm tra:
1. Đã chạy migration chưa?
2. Đã chạy `npx prisma generate` chưa?
3. Đã restart dev server chưa?
4. Check terminal logs để xem lỗi chi tiết (đã thêm console.error)
