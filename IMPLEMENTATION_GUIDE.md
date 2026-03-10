# Hướng dẫn hoàn thiện các module còn lại

## ✅ Đã hoàn thành

- Database Schema với purchaseDate
- Dashboard mới với Recharts
- Module Website hoàn chỉnh
- Design system mới

## 🚧 Cần làm tiếp

### 1. Module Khách hàng (Customers)

#### API Routes cần tạo:

**`app/api/customers/route.ts`**
```typescript
// GET - Lấy danh sách khách hàng
// POST - Tạo khách hàng mới
```

**`app/api/customers/[id]/route.ts`**
```typescript
// GET - Chi tiết khách hàng + lịch sử đơn hàng
// PATCH - Cập nhật khách hàng
// DELETE - Xóa khách hàng
```

#### Pages cần tạo:

**`app/(dashboard)/customers/page.tsx`**
- Danh sách khách hàng với table
- Button "Thêm khách hàng"
- Action buttons: Edit, Delete
- Click vào tên → xem chi tiết

**`app/(dashboard)/customers/[id]/page.tsx`**
- Thông tin khách hàng
- Lịch sử đơn hàng
- Tổng doanh thu từ khách này

#### Components:

**`components/customers/CustomerModal.tsx`**
- Form: telegramUsername, name, note
- Design theo style mới

---

### 2. Module Đơn hàng (Orders)

#### API Routes:

**`app/api/orders/route.ts`**
```typescript
// GET - Danh sách đơn hàng (có filter paymentStatus)
// POST - Tạo đơn mới với nhiều OrderItems
```

**`app/api/orders/[id]/route.ts`**
```typescript
// GET - Chi tiết đơn hàng
// PATCH - Cập nhật paymentStatus
// DELETE - Xóa đơn
```

**`app/api/orders/[id]/renew/route.ts`**
```typescript
// POST - Gia hạn textlinks từ đơn cũ
```

#### Pages:

**`app/(dashboard)/orders/page.tsx`**
- Table với filter theo paymentStatus
- Badge màu: ORDERED (vàng), PAID (xanh), UNPAID (cam), DEBT (đỏ)
- Button "Tạo đơn hàng"
- Action: View, Edit status, Renew

**`app/(dashboard)/orders/create/page.tsx`**
Multi-step form:
1. Chọn khách hàng (dropdown)
2. Chọn textlinks (checkboxes từ websites)
3. Xác nhận + override giá nếu cần
4. Submit

#### Components:

**`components/orders/OrderModal.tsx`**
**`components/orders/RenewModal.tsx`**

---

### 3. Module Chi phí (Expenses)

#### API Routes:

**`app/api/expenses/route.ts`**
```typescript
// GET - Danh sách chi phí (filter by category, month)
// POST - Tạo chi phí mới
```

**`app/api/expenses/[id]/route.ts`**
```typescript
// PATCH - Cập nhật
// DELETE - Xóa
```

#### Pages:

**`app/(dashboard)/expenses/page.tsx`**
- Table chi phí
- Filter theo category và tháng
- Tổng chi phí hiển thị trên đầu
- Button "Thêm chi phí"

#### Components:

**`components/expenses/ExpenseModal.tsx`**
- Form: category (select), amount, note, date
- Design theo style

---

### 4. Module Báo cáo (Reports)

#### API Routes:

**`app/api/reports/profit-loss/route.ts`**
```typescript
// GET - Lấy báo cáo lãi/lỗ theo filter
// Query params: month, quarter, year
```

**`app/api/reports/export/route.ts`**
```typescript
// GET - Xuất Excel
// Dùng exceljs để generate file
```

#### Pages:

**`app/(dashboard)/reports/page.tsx`**
- Filter: Tháng/Quý/Năm
- Hiển thị:
  - Tổng doanh thu
  - Tổng chi phí
  - Lãi ròng (dương = xanh, âm = đỏ)
- Table: Lãi/lỗ từng website
- Button "Xuất Excel"

---

## 📐 Design System (áp dụng cho tất cả)

```css
/* Màu sắc */
Background: #ffffff
Sidebar: #f8fafb
Accent: #0d9488
Accent hover: #0f766e
Text: #111827
Text muted: #6b7280
Border: #e5e7eb
Stat card: #f0fdfa

/* Badge Colors */
Success (PAID): #0d9488
Warning (ORDERED): #f59e0b
Error (UNPAID): #ef4444
```

## 🔧 Utils cần dùng

```typescript
// lib/utils.ts đã có:
formatCurrency(amount) // "$50.00 USDT"
formatDate(date) // "08/03/2026"
formatDateTime(date) // "08/03/2026 15:30"
```

## 📊 Biểu đồ Recharts

Đã setup trong Dashboard. Tái sử dụng pattern:

```typescript
import { BarChart, Bar, XAxis, YAxis ... } from "recharts"
// Xem components/dashboard/RevenueChart.tsx
```

## 🎯 Quy tắc nghiệp vụ quan trọng

1. **Giá textlink** - unitPrice lưu tại thời điểm tạo đơn
2. **Gia hạn** - Tạo OrderItem mới, giá = giá hiện tại (có thể override)
3. **Doanh thu** - Chỉ tính Order có paymentStatus = PAID
4. **Lãi/lỗ website** = Doanh thu từ website - buyPrice
5. **Auto-expire** - Cần cron job cập nhật status EXPIRED

## 🚀 Next Steps

1. Copy templates này
2. Tạo API routes theo structure trên
3. Tạo pages với design system mới
4. Test từng module
5. Deploy

## 📞 Support

- Database schema: `prisma/schema.prisma`
- Design reference: Xem Dashboard và Website pages đã làm
- API pattern: Xem `app/api/websites/route.ts`
