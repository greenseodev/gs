# Xanh SEO - Hệ Thống Quản Lý Textlink

## 📋 Tổng Quan Dự Án

**Xanh SEO** là hệ thống quản lý kinh doanh textlink (backlink) hoàn chỉnh, được xây dựng bằng Next.js 16 với TypeScript, Prisma ORM, và PostgreSQL. Hệ thống giúp quản lý websites, khách hàng, đơn hàng, giá cả, và báo cáo lợi nhuận.

### Mục đích chính:
- Quản lý danh mục websites bán textlink
- Quản lý khách hàng và đơn hàng
- Tính toán doanh thu với chiết khấu và nhiều textlink entries
- Theo dõi chi phí và lợi nhuận
- Báo cáo thống kê và xuất Excel

### Tech Stack:
- **Framework**: Next.js 16.1.6 (App Router)
- **Language**: TypeScript 5
- **Database**: PostgreSQL
- **ORM**: Prisma 7.4.2
- **Authentication**: NextAuth.js 4.24.13
- **UI**: Tailwind CSS 4 + Lucide React Icons
- **Charts**: Recharts 3.8.0
- **Excel Export**: ExcelJS 4.4.0
- **Date Handling**: date-fns 4.1.0

---

## 🗄️ Database Schema (Prisma)

### 1. **User** - Quản lý người dùng hệ thống
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // Hashed with bcryptjs
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Mục đích**: Lưu tài khoản admin/staff đăng nhập vào hệ thống

---

### 2. **Website** - Danh mục websites bán textlink
```prisma
model Website {
  id           String   @id @default(cuid())
  domain       String   @unique
  dr           Int      // Domain Rating (Ahrefs metric)
  traffic      Int      // Monthly traffic
  buyPrice     Float    // Giá mua website
  purchaseDate DateTime @default(now())
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  textlinkPrices TextlinkPrice[]
  orderItems     OrderItem[]
}
```

**Mục đích**: Quản lý websites có thể bán textlink
- `dr`: Domain Rating từ Ahrefs (chỉ số uy tín domain)
- `traffic`: Lượng truy cập hàng tháng
- `buyPrice`: Giá mua website (để tính lợi nhuận)

**Relations**:
- 1 Website → nhiều TextlinkPrice (giá theo loại và thời hạn)
- 1 Website → nhiều OrderItem (các đơn hàng đã bán)

---

### 3. **TextlinkPrice** - Bảng giá textlink
```prisma
model TextlinkPrice {
  id            String       @id @default(cuid())
  websiteId     String
  type          TextlinkType // FOOTER | HOMEPAGE
  duration      Duration     // ONE_MONTH | THREE_MONTHS
  price         Float
  effectiveFrom DateTime     @default(now())
  createdAt     DateTime     @default(now())

  website Website @relation(fields: [websiteId], references: [id], onDelete: Cascade)

  @@index([websiteId, effectiveFrom])
}
```

**Mục đích**: Quản lý giá bán textlink theo loại và thời hạn
- `type`: FOOTER (footer link) hoặc HOMEPAGE (homepage link)
- `duration`: ONE_MONTH (1 tháng) hoặc THREE_MONTHS (3 tháng)
- `effectiveFrom`: Ngày bắt đầu áp dụng giá (hỗ trợ thay đổi giá theo thời gian)

**Logic**:
- Mỗi website có thể có nhiều mức giá (ví dụ: Homepage 1T = $30, Footer 3T = $50)
- Khi tạo đơn, lấy giá mới nhất (`effectiveFrom DESC`)

---

### 4. **Customer** - Khách hàng
```prisma
model Customer {
  id               String   @id @default(cuid())
  telegramUsername String?  // @username Telegram (optional)
  name             String
  note             String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  orders Order[]
}
```

**Mục đích**: Quản lý thông tin khách hàng
- `telegramUsername`: Username Telegram để liên lạc
- `note`: Ghi chú về khách hàng

**Relations**:
- 1 Customer → nhiều Order

---

### 5. **Order** - Đơn hàng
```prisma
model Order {
  id            String        @id @default(cuid())
  customerId    String
  paymentStatus PaymentStatus @default(ORDERED)
  discount      Float         @default(0) // % chiết khấu
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  customer   Customer    @relation(fields: [customerId], references: [id], onDelete: Cascade)
  orderItems OrderItem[]

  @@index([customerId])
}
```

**Mục đích**: Đơn hàng của khách (1 đơn có thể chứa nhiều OrderItem)
- `paymentStatus`: ORDERED | PAID | UNPAID | DEBT
- `discount`: Chiết khấu % cho toàn đơn (ví dụ: 10 = 10%)

**Logic Tính Tiền**:
```typescript
subtotal = Σ(orderItem.unitPrice × orderItem.entries.length)
discountAmount = subtotal × (discount / 100)
total = subtotal - discountAmount
```

**Relations**:
- 1 Order → 1 Customer
- 1 Order → nhiều OrderItem

---

### 6. **OrderItem** - Chi tiết đơn hàng (1 website trong đơn)
```prisma
model OrderItem {
  id        String          @id @default(cuid())
  orderId   String
  websiteId String
  type      TextlinkType    // FOOTER | HOMEPAGE
  duration  Duration        // ONE_MONTH | THREE_MONTHS
  unitPrice Float           // Giá 1 link tại thời điểm đặt hàng
  startDate DateTime
  endDate   DateTime
  status    OrderItemStatus @default(PENDING)
  createdAt DateTime        @default(now())
  updatedAt DateTime        @updatedAt

  order   Order             @relation(fields: [orderId], references: [id], onDelete: Cascade)
  website Website           @relation(fields: [websiteId], references: [id], onDelete: Restrict)
  entries TextlinkEntry[]

  @@index([orderId])
  @@index([websiteId])
  @@index([endDate])
  @@index([status])
}
```

**Mục đích**: 1 OrderItem = 1 gói textlink trên 1 website
- `unitPrice`: Giá 1 link (lưu giá tại thời điểm đặt, không thay đổi theo bảng giá mới)
- `status`: ACTIVE | EXPIRED | PENDING
- `startDate`, `endDate`: Thời hạn sử dụng

**Logic**:
- 1 OrderItem có nhiều TextlinkEntry (các link thực tế)
- Tổng giá 1 OrderItem = `unitPrice × entries.length`
- `onDelete: Restrict` trên website → không thể xóa website đang có OrderItem

**Relations**:
- 1 OrderItem → 1 Order
- 1 OrderItem → 1 Website
- 1 OrderItem → nhiều TextlinkEntry

---

### 7. **TextlinkEntry** - Textlink thực tế (anchor + URL)
```prisma
model TextlinkEntry {
  id          String   @id @default(cuid())
  orderItemId String
  anchorText  String   // Anchor text (từ khóa)
  targetUrl   String   // URL đích
  position    Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  orderItem OrderItem @relation(fields: [orderItemId], references: [id], onDelete: Cascade)

  @@index([orderItemId])
}
```

**Mục đích**: Lưu chi tiết từng textlink trong OrderItem
- `anchorText`: Anchor text (ví dụ: "Mua điện thoại online")
- `targetUrl`: URL đích (ví dụ: "https://example.com/dien-thoai")
- `position`: Thứ tự hiển thị (0, 1, 2, ...)

**Ví dụ**:
OrderItem 1 website có 13 entries:
```
Entry 1: "Sản phẩm A" → https://example.com/a
Entry 2: "Dịch vụ B" → https://example.com/b
...
Entry 13: "Công ty Z" → https://example.com/z
```

**Relations**:
- 1 TextlinkEntry → 1 OrderItem

---

### 8. **Expense** - Chi phí
```prisma
model Expense {
  id       String          @id @default(cuid())
  category ExpenseCategory
  amount   Float
  note     String?
  date     DateTime
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt

  @@index([date])
  @@index([category])
}
```

**Mục đích**: Ghi lại các khoản chi phí
- `category`: WEBSITE_PURCHASE | VPS | DOMAIN_RENEWAL | PARTNER_SHARE | OTHER
- `amount`: Số tiền chi
- `date`: Ngày phát sinh chi phí

**Logic**:
- Dùng để tính lợi nhuận: `Lợi nhuận = Doanh thu - Chi phí`

---

### Enums

```prisma
enum TextlinkType {
  FOOTER      // Link đặt ở footer
  HOMEPAGE    // Link đặt ở homepage
}

enum Duration {
  ONE_MONTH      // 1 tháng
  THREE_MONTHS   // 3 tháng
}

enum PaymentStatus {
  ORDERED   // Đã đặt hàng
  PAID      // Đã thanh toán
  UNPAID    // Chưa thanh toán
  DEBT      // Công nợ
}

enum OrderItemStatus {
  ACTIVE    // Đang hoạt động
  EXPIRED   // Đã hết hạn
  PENDING   // Đang chờ
}

enum ExpenseCategory {
  WEBSITE_PURCHASE  // Mua website
  VPS               // Chi phí VPS/hosting
  DOMAIN_RENEWAL    // Gia hạn domain
  PARTNER_SHARE     // Chia lợi nhuận cho partner
  OTHER             // Khác
}
```

---

## 🛣️ Routes & API Endpoints

### Authentication

#### `POST /api/auth/[...nextauth]`
**File**: [app/api/auth/[...nextauth]/route.ts](app/api/auth/[...nextauth]/route.ts)
**Mục đích**: Xử lý đăng nhập NextAuth
- Credentials provider (email + password)
- Hashed password với bcryptjs
- Session JWT-based

**Request**:
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Middleware Protection**: Tất cả routes ngoài `/login` và `/api` đều yêu cầu authentication

---

### Websites Management

#### `GET /api/websites`
**File**: [app/api/websites/route.ts](app/api/websites/route.ts)
**Mục đích**: Lấy danh sách tất cả websites với giá mới nhất

**Response**:
```json
[
  {
    "id": "...",
    "domain": "example.com",
    "dr": 50,
    "traffic": 10000,
    "buyPrice": 500,
    "purchaseDate": "2024-01-01T00:00:00.000Z",
    "textlinkPrices": [
      {
        "id": "...",
        "type": "HOMEPAGE",
        "duration": "ONE_MONTH",
        "price": 30,
        "effectiveFrom": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
]
```

#### `POST /api/websites`
**Mục đích**: Tạo website mới

**Request**:
```json
{
  "domain": "example.com",
  "dr": 50,
  "traffic": 10000,
  "buyPrice": 500
}
```

#### `PATCH /api/websites/:id`
**File**: [app/api/websites/[id]/route.ts](app/api/websites/[id]/route.ts)
**Mục đích**: Cập nhật thông tin website

#### `DELETE /api/websites/:id`
**Mục đích**: Xóa website
- **Kiểm tra**: Không thể xóa nếu có OrderItem liên quan (bất kể status)
- Hiển thị số lượng OrderItem: "X order items (Y active, Z expired, W pending)"

---

#### `POST /api/websites/:id/prices`
**File**: [app/api/websites/[id]/prices/route.ts](app/api/websites/[id]/prices/route.ts)
**Mục đích**: Thêm/cập nhật giá textlink cho website

**Request**:
```json
{
  "type": "HOMEPAGE",
  "duration": "ONE_MONTH",
  "price": 30
}
```

**Logic**:
- Tạo TextlinkPrice mới với `effectiveFrom = now()`
- Giữ nguyên các giá cũ (để xem lịch sử)

---

### Customers Management

#### `GET /api/customers`
**File**: [app/api/customers/route.ts](app/api/customers/route.ts)
**Mục đích**: Lấy danh sách khách hàng

**Response**:
```json
[
  {
    "id": "...",
    "telegramUsername": "@customer1",
    "name": "Nguyễn Văn A",
    "note": "Khách VIP",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### `POST /api/customers`
**Mục đích**: Tạo khách hàng mới

**Request**:
```json
{
  "telegramUsername": "@customer1",
  "name": "Nguyễn Văn A",
  "note": "Khách VIP"
}
```

#### `PATCH /api/customers/:id`
**File**: [app/api/customers/[id]/route.ts](app/api/customers/[id]/route.ts)
**Mục đích**: Cập nhật thông tin khách hàng

#### `DELETE /api/customers/:id`
**Mục đích**: Xóa khách hàng
- **Cascade**: Xóa luôn tất cả Orders của khách

---

### Orders Management

#### `GET /api/orders`
**File**: [app/api/orders/route.ts](app/api/orders/route.ts)
**Mục đích**: Lấy danh sách đơn hàng

**Query Params**:
- `paymentStatus`: Filter theo trạng thái (PAID, UNPAID, DEBT, ORDERED)

**Response**:
```json
[
  {
    "id": "...",
    "customerId": "...",
    "paymentStatus": "PAID",
    "discount": 10,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "customer": {
      "id": "...",
      "name": "Nguyễn Văn A",
      "telegramUsername": "@customer1"
    },
    "orderItems": [
      {
        "id": "...",
        "websiteId": "...",
        "type": "HOMEPAGE",
        "duration": "ONE_MONTH",
        "unitPrice": 30,
        "startDate": "2024-01-01T00:00:00.000Z",
        "endDate": "2024-02-01T00:00:00.000Z",
        "status": "ACTIVE",
        "website": {
          "domain": "example.com",
          "dr": 50,
          "traffic": 10000
        },
        "entries": [
          {
            "id": "...",
            "anchorText": "Sản phẩm A",
            "targetUrl": "https://example.com/a",
            "position": 0
          }
        ]
      }
    ]
  }
]
```

#### `POST /api/orders`
**Mục đích**: Tạo đơn hàng mới

**Request**:
```json
{
  "customerId": "...",
  "discount": 10,
  "paymentStatus": "ORDERED",
  "items": [
    {
      "websiteId": "...",
      "type": "HOMEPAGE",
      "duration": "ONE_MONTH",
      "unitPrice": 30,
      "startDate": "2024-01-01",
      "endDate": "2024-02-01",
      "entries": [
        {
          "anchorText": "Sản phẩm A",
          "targetUrl": "https://example.com/a",
          "position": 0
        },
        {
          "anchorText": "Sản phẩm B",
          "targetUrl": "https://example.com/b",
          "position": 1
        }
      ]
    }
  ]
}
```

**Logic**:
- Tạo Order với discount
- Tạo OrderItem cho mỗi item
- Tạo TextlinkEntry cho mỗi entry trong item

#### `GET /api/orders/:id`
**File**: [app/api/orders/[id]/route.ts](app/api/orders/[id]/route.ts)
**Mục đích**: Lấy chi tiết 1 đơn hàng

**Response**: Giống GET /api/orders nhưng chỉ 1 object

#### `PATCH /api/orders/:id`
**Mục đích**: Cập nhật trạng thái đơn hàng

**Request**:
```json
{
  "paymentStatus": "PAID"
}
```

#### `DELETE /api/orders/:id`
**Mục đích**: Xóa đơn hàng
- **Cascade**: Xóa luôn OrderItems và TextlinkEntries
- **Điều kiện**: Chỉ xóa được khi `paymentStatus !== "PAID"`

---

#### `POST /api/orders/:id/renew`
**File**: [app/api/orders/[id]/renew/route.ts](app/api/orders/[id]/renew/route.ts)
**Mục đích**: Gia hạn các OrderItems đã chọn

**Request**:
```json
{
  "itemIds": ["orderItem1", "orderItem2"],
  "prices": {
    "orderItem1": 35  // Override giá (optional)
  }
}
```

**Logic**:
1. Lấy thông tin OrderItems cần gia hạn (bao gồm `entries`)
2. Tính giá mới (nếu không override thì lấy giá mới nhất từ TextlinkPrice)
3. Tạo Order mới với:
   - Cùng customerId
   - paymentStatus = ORDERED
   - discount = 0
4. Tạo OrderItems mới với:
   - startDate = now()
   - endDate = startDate + duration
   - **Copy tất cả entries từ OrderItem cũ**
5. Return Order mới

**Response**: Order object với OrderItems và entries mới

---

#### `PUT /api/orders/:id/items/:itemId/entries`
**File**: [app/api/orders/[id]/items/[itemId]/entries/route.ts](app/api/orders/[id]/items/[itemId]/entries/route.ts)
**Mục đích**: Cập nhật bulk entries cho 1 OrderItem

**Request**:
```json
{
  "entries": [
    {
      "anchorText": "New Anchor 1",
      "targetUrl": "https://example.com/new1",
      "position": 0
    },
    {
      "anchorText": "New Anchor 2",
      "targetUrl": "https://example.com/new2",
      "position": 1
    }
  ]
}
```

**Logic**:
1. Xác thực orderItem thuộc về order
2. **Transaction atomic**:
   - DELETE tất cả entries cũ của orderItem
   - CREATE entries mới
3. Return orderItem với entries mới

**Response**:
```json
{
  "id": "...",
  "orderItemId": "...",
  "entries": [...]
}
```

---

### Expenses Management

#### `GET /api/expenses`
**File**: [app/api/expenses/route.ts](app/api/expenses/route.ts)
**Mục đích**: Lấy danh sách chi phí

**Response**:
```json
[
  {
    "id": "...",
    "category": "WEBSITE_PURCHASE",
    "amount": 500,
    "note": "Mua example.com",
    "date": "2024-01-01T00:00:00.000Z"
  }
]
```

#### `POST /api/expenses`
**Mục đích**: Tạo chi phí mới

**Request**:
```json
{
  "category": "VPS",
  "amount": 50,
  "note": "VPS tháng 1",
  "date": "2024-01-01"
}
```

#### `PATCH /api/expenses/:id`
**File**: [app/api/expenses/[id]/route.ts](app/api/expenses/[id]/route.ts)
**Mục đích**: Cập nhật chi phí

#### `DELETE /api/expenses/:id`
**Mục đích**: Xóa chi phí

---

### Reports & Analytics

#### `GET /api/reports/profit-loss`
**File**: [app/api/reports/profit-loss/route.ts](app/api/reports/profit-loss/route.ts)
**Mục đích**: Báo cáo lợi nhuận theo khoảng thời gian

**Query Params**:
- `period`: "month" | "quarter" | "year"
- `year`: năm (ví dụ: "2024")
- `month`: tháng (1-12) - bắt buộc nếu period=month
- `quarter`: quý (1-4) - bắt buộc nếu period=quarter

**Response**:
```json
{
  "period": {
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-01-31T23:59:59.000Z"
  },
  "totalRevenue": 5000,
  "totalExpenses": 1000,
  "netProfit": 4000,
  "websiteProfitLoss": [
    {
      "domain": "example.com",
      "revenue": 2000,
      "buyPrice": 500,
      "profit": 1500
    }
  ],
  "expensesByCategory": {
    "WEBSITE_PURCHASE": 500,
    "VPS": 200,
    "DOMAIN_RENEWAL": 100
  }
}
```

**Logic Tính Toán**:
```typescript
// Chỉ tính PAID orders
totalRevenue = Σ(order.subtotal × (1 - order.discount / 100))
  where subtotal = Σ(item.unitPrice × item.entries.length)

totalExpenses = Σ(expenses trong khoảng thời gian)

netProfit = totalRevenue - totalExpenses

// Website profit
websiteRevenue[websiteId] = Σ(itemRevenue)
  where itemRevenue = (unitPrice × entries.length) × (1 - discount / 100)
websiteProfit[websiteId] = websiteRevenue - website.buyPrice
```

#### `GET /api/reports/export`
**File**: [app/api/reports/export/route.ts](app/api/reports/export/route.ts)
**Mục đích**: Xuất báo cáo Excel

**Query Params**: Giống `/api/reports/profit-loss`

**Response**: File Excel (.xlsx) với sheets:
- Summary: Tổng quan doanh thu, chi phí, lợi nhuận
- Website Performance: Doanh thu và lợi nhuận từng website
- Expenses: Chi tiết chi phí

---

## 📄 Pages (Frontend)

### Public Pages

#### `/login`
**File**: [app/login/page.tsx](app/login/page.tsx)
**Mô tả**: Trang đăng nhập
- Form email + password
- Gọi NextAuth signIn()
- Redirect về `/` sau khi đăng nhập thành công

---

### Dashboard Pages (Protected)

**Layout**: [app/(dashboard)/layout.tsx](app/(dashboard)/layout.tsx)
- Sidebar navigation
- User info & logout button
- Dark theme design (Binance-inspired)

#### `/` (Dashboard)
**File**: [app/(dashboard)/page.tsx](app/(dashboard)/page.tsx)
**Mô tả**: Trang tổng quan

**KPI Cards**:
- 💰 Doanh thu tháng này (chỉ PAID orders)
- 📈 Tăng trưởng so với tháng trước (%)
- 💵 Tổng doanh thu all-time
- 💸 Chi phí tháng này
- 📊 Lãi ròng tháng này (Revenue - Expenses)
- 🔗 Số textlinks đang hoạt động (ACTIVE OrderItems)
- 🌐 Tổng số websites
- ⚠️ Số slot trống (TextlinkPrice chưa có OrderItem)

**Charts**:
- 📊 Biểu đồ cột: Doanh thu vs Chi phí 6 tháng gần nhất (Recharts)

**Tables**:
- 🔴 Textlinks sắp hết hạn (≤2 ngày)
- ❌ Textlinks đã hết hạn chưa gia hạn
- 💵 Đơn chưa thu tiền (UNPAID + DEBT)
- 🏆 Top 5 websites doanh thu cao nhất tháng này
- 👑 Top 5 khách hàng chi tiêu nhiều nhất tháng này
- 🆕 Websites mới thêm gần đây

**Server Component**: Fetch data trực tiếp từ Prisma trong component

---

#### `/websites`
**File**: [app/(dashboard)/websites/page.tsx](app/(dashboard)/websites/page.tsx)
**Mô tả**: Quản lý websites

**Features**:
- 📋 Table danh sách websites với domain, DR, traffic, buyPrice
- ➕ Nút "Thêm website" → mở WebsiteModal
- ✏️ Nút "Sửa" → mở WebsiteModal với dữ liệu
- 🗑️ Nút "Xóa" → confirm trước khi xóa
- 💰 Nút "Giá" → mở PriceModal để thêm/sửa giá textlink

**Modal Components**:
- `WebsiteModal`: Thêm/sửa website
- `PriceModal`: Quản lý giá textlink (FOOTER/HOMEPAGE, 1T/3T)

---

#### `/customers`
**File**: [app/(dashboard)/customers/page.tsx](app/(dashboard)/customers/page.tsx)
**Mô tả**: Quản lý khách hàng

**Features**:
- 📋 Table danh sách khách hàng
- ➕ Nút "Thêm khách hàng" → mở CustomerModal
- ✏️ Nút "Sửa" → mở CustomerModal với dữ liệu
- 🗑️ Nút "Xóa" → confirm trước khi xóa

**Modal Components**:
- `CustomerModal`: Thêm/sửa khách (telegramUsername, name, note)

---

#### `/orders`
**File**: [app/(dashboard)/orders/page.tsx](app/(dashboard)/orders/page.tsx)
**Mô tả**: Quản lý đơn hàng

**Features**:
- 📊 Stats cards: Tổng đơn, Đã thanh toán, Chưa thu tiền, Doanh thu (PAID)
- 🔍 Filter tabs: Tất cả | ORDERED | PAID | UNPAID | DEBT
- 📋 Table đơn hàng với:
  - Mã đơn (#abc123...)
  - Khách hàng (name + Telegram)
  - Số textlinks (tổng entries)
  - Tổng tiền (đã tính discount)
  - Dropdown thay đổi trạng thái thanh toán
  - Ngày tạo
  - Nút "Chi tiết" → redirect `/orders/:id`
- ➕ Nút "Tạo đơn hàng" → redirect `/orders/create`

**Tính Tổng Tiền**:
```typescript
subtotal = Σ(item.unitPrice × item.entries.length)
total = subtotal × (1 - order.discount / 100)
```

---

#### `/orders/create`
**File**: [app/(dashboard)/orders/create/page.tsx](app/(dashboard)/orders/create/page.tsx)
**Mô tả**: Tạo đơn hàng mới (Multi-step wizard)

**Step 1: Chọn khách hàng**
- Dropdown chọn customer
- Hiển thị Telegram username

**Step 2: Thêm textlinks**
- Dropdown chọn website
- Hiển thị giá mới nhất (HOMEPAGE 1T, FOOTER 3T, ...)
- Chọn loại textlink (HOMEPAGE/FOOTER)
- Chọn thời hạn (1 tháng / 3 tháng)
- Nhập giá (có thể override)
- Chọn ngày bắt đầu & kết thúc
- **2 Textareas để nhập entries**:
  - Left: Anchor texts (mỗi dòng 1 anchor)
  - Right: Target URLs (mỗi dòng 1 URL)
  - Validation: Số dòng phải bằng nhau
  - Real-time count hiển thị số entries

**Step 3: Xác nhận & Chiết khấu**
- Review danh sách items đã thêm
- **Discount Selector**:
  - 5 nút preset: 0%, 5%, 10%, 15%, 20%
  - Input tùy chỉnh (0-100%)
- **Sidebar Summary**:
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
- Nút "Tạo đơn hàng" → POST /api/orders → redirect `/orders`

---

#### `/orders/:id`
**File**: [app/(dashboard)/orders/[id]/page.tsx](app/(dashboard)/orders/[id]/page.tsx)
**Mô tả**: Chi tiết đơn hàng

**Features**:
- 📋 Header:
  - Mã đơn + Ngày tạo
  - Nút "Gia hạn" (chỉ hiện khi chọn items)
  - Nút "Xóa" (chỉ hiện khi paymentStatus !== PAID)

- 📦 **OrderItemCard Component** (Compact UI):
  - Checkbox để chọn item
  - Website info (domain, DR, traffic)
  - Price breakdown: **$330.00** ($30 × 11)
  - Status badge + time remaining
  - **Visual Monitoring**:
    - 🟡 Yellow border + pulse: ≤7 days remaining
    - 🔴 Red border + opacity: Expired
    - 🟢 Green dot pulse: Active
  - **4-column table**: # | Anchor | URL | Edit
  - Show first 4 entries, "Xem thêm X links" button
  - Clean URLs (no https://, www.)
  - Nút "Sửa" ở table header → mở EditEntriesModal

- 📊 **Sidebar**:
  - Thông tin khách hàng
  - Trạng thái thanh toán
  - Số gói / Số links
  - Breakdown:
    ```
    Tạm tính:     $565.00
    Chiết khấu:   -$56.50 (10%)
    ────────────────────────
    Tổng cộng:    $508.50
    ```

**Modal Components**:
- `EditEntriesModal`: Sửa bulk entries với 2 textareas (anchor | URL)

**Actions**:
- **Gia hạn**: Chọn items → nhấn "Gia hạn" → POST /api/orders/:id/renew → redirect `/orders`
- **Xóa đơn**: Nhấn "Xóa" → confirm → DELETE /api/orders/:id → redirect `/orders`

---

#### `/expenses`
**File**: [app/(dashboard)/expenses/page.tsx](app/(dashboard)/expenses/page.tsx)
**Mô tả**: Quản lý chi phí

**Features**:
- 📋 Table danh sách chi phí với category, amount, note, date
- ➕ Nút "Thêm chi phí" → mở ExpenseModal
- ✏️ Nút "Sửa" → mở ExpenseModal với dữ liệu
- 🗑️ Nút "Xóa" → confirm trước khi xóa

**Modal Components**:
- `ExpenseModal`: Thêm/sửa chi phí (category, amount, note, date)

---

#### `/reports`
**File**: [app/(dashboard)/reports/page.tsx](app/(dashboard)/reports/page.tsx)
**Mô tả**: Báo cáo lợi nhuận

**Features**:
- 🔍 **Filter Form**:
  - Chọn period: Month | Quarter | Year
  - Chọn Year (dropdown)
  - Conditional fields: Month (1-12) hoặc Quarter (1-4)
  - Nút "Xem báo cáo"

- 📊 **Summary Cards**:
  - 💰 Tổng doanh thu
  - 💸 Tổng chi phí
  - 📈 Lãi ròng
  - % Lợi nhuận

- 📋 **Tables**:
  - **Website Performance**: Domain | Doanh thu | Giá mua | Lợi nhuận
  - **Chi phí theo danh mục**: Category | Số tiền

- 📥 Nút "Xuất Excel" → GET /api/reports/export → download file .xlsx

---

## 🧩 Components (Reusable)

### Layout Components

#### `Sidebar`
**File**: [components/Sidebar.tsx](components/Sidebar.tsx)
**Mô tả**: Sidebar navigation
- Logo
- Nav links: Dashboard, Websites, Customers, Orders, Expenses, Reports
- User info + Logout button
- Active state highlighting

---

### Modal Components

#### `WebsiteModal`
**File**: [components/websites/WebsiteModal.tsx](components/websites/WebsiteModal.tsx)
**Props**: `isOpen`, `onClose`, `website` (optional), `onSave`
**Fields**: domain, dr, traffic, buyPrice

#### `PriceModal`
**File**: [components/websites/PriceModal.tsx](components/websites/PriceModal.tsx)
**Props**: `isOpen`, `onClose`, `websiteId`, `prices`
**Features**: Add/update TextlinkPrice (type, duration, price)

#### `CustomerModal`
**File**: [components/customers/CustomerModal.tsx](components/customers/CustomerModal.tsx)
**Props**: `isOpen`, `onClose`, `customer` (optional), `onSave`
**Fields**: telegramUsername, name, note

#### `ExpenseModal`
**File**: [components/expenses/ExpenseModal.tsx](components/expenses/ExpenseModal.tsx)
**Props**: `isOpen`, `onClose`, `expense` (optional), `onSave`
**Fields**: category, amount, note, date

#### `EditEntriesModal`
**File**: [components/orders/EditEntriesModal.tsx](components/orders/EditEntriesModal.tsx)
**Props**: `isOpen`, `onClose`, `itemId`, `orderId`, `entries`, `onSave`
**Features**:
- 2 textareas: Anchors (left) | URLs (right)
- Real-time line count validation
- Color-coded feedback (green = match, red = mismatch)
- Atomic save (DELETE all → CREATE new)

---

### Order Components

#### `OrderItemCard`
**File**: [components/orders/OrderItemCard.tsx](components/orders/OrderItemCard.tsx)
**Props**: `item`, `isSelected`, `onToggle`, `onEditEntries`
**Features**:
- Compact card with checkbox selection
- Website info (domain, DR, traffic, type, duration)
- Price breakdown: **$330** ($30 × 11)
- Visual monitoring (borders, pulse animations)
- 4-column table: # | Anchor | URL | Edit
- Expand/collapse (show 4 entries by default)
- Clean URLs display

---

### Dashboard Components

#### `RevenueChart`
**File**: [components/dashboard/RevenueChart.tsx](components/dashboard/RevenueChart.tsx)
**Props**: `data` (6 months revenue & expense)
**Features**: Bar chart với Recharts (Revenue vs Expense)

---

### Provider Components

#### `SessionProvider`
**File**: [components/providers/SessionProvider.tsx](components/providers/SessionProvider.tsx)
**Mô tả**: Wrap NextAuth SessionProvider cho client components

---

## 🎨 UI/UX Design

### Theme
- **Inspiration**: Binance dark theme
- **Colors**:
  - Background: `#0b0e11` (dark), `#181a20` (cards)
  - Border: `#2b3139` (subtle)
  - Text: `#eaecef` (primary), `#848e9c` (secondary)
  - Primary: `#fcd535` (yellow/gold)
  - Success: `#0ecb81` (green)
  - Danger: `#f6465d` (red)
  - Info: `#5b8def` (blue)
  - Warning: `#f0b90b` (orange)

### Typography
- Font: System fonts (sans-serif)
- Sizes: xs (11px), sm (13px), base (14px), lg (16px), xl (18px)

### Components Style
- Cards: Dark background, subtle border, rounded corners
- Buttons: Gradient (primary), solid (secondary)
- Inputs: Dark background, border on focus
- Tables: Hover effects, alternating rows
- Modals: Centered overlay, dark backdrop

### Responsive
- Mobile-first approach
- Grid layouts with Tailwind
- Sidebar collapsible on mobile

---

## 🔐 Authentication & Authorization

### NextAuth.js Setup
- **Provider**: Credentials (email + password)
- **Session**: JWT-based
- **Password**: Hashed with bcryptjs (10 rounds)

### Middleware Protection
**File**: [middleware.ts](middleware.ts)
- Protects all routes except: `/login`, `/api`, `/_next/*`, `/favicon.ico`
- Redirects unauthenticated users to `/login`

### API Security
- All API routes check `getServerSession(authOptions)`
- Return 401 Unauthorized if no session

---

## 📊 Business Logic

### 1. Tính Giá OrderItem
```typescript
itemTotal = unitPrice × entries.length
```

**Ví dụ**:
- Website: example.com
- UnitPrice: $30/link
- Entries: 13 links
- **Total**: $30 × 13 = **$390**

---

### 2. Tính Tổng Đơn Hàng (với Discount)
```typescript
subtotal = Σ(orderItem.unitPrice × orderItem.entries.length)
discountAmount = subtotal × (order.discount / 100)
total = subtotal - discountAmount
```

**Ví dụ**:
```
Website A: $30 × 13 = $390
Website B: $25 × 7  = $175
─────────────────────────────
Subtotal:           $565
Discount (10%):     -$56.50
─────────────────────────────
Total:              $508.50
```

---

### 3. Tính Doanh Thu (chỉ PAID orders)
```typescript
revenue = Σ(order.total where paymentStatus = PAID)
```

---

### 4. Tính Lợi Nhuận
```typescript
profit = revenue - expenses
```

---

### 5. Tính Lợi Nhuận từng Website
```typescript
websiteRevenue[websiteId] = Σ(itemRevenue for this website)
websiteProfit[websiteId] = websiteRevenue - website.buyPrice
```

**Logic phân bổ discount**:
```typescript
itemSubtotal = unitPrice × entries.length
itemRevenue = itemSubtotal × (1 - order.discount / 100)
```

---

### 6. OrderItem Status Logic
- **PENDING**: Mới tạo, chưa active
- **ACTIVE**: Đang trong thời hạn (`now >= startDate && now <= endDate`)
- **EXPIRED**: Đã hết hạn (`now > endDate`)

**Cron Job** (chưa implement):
- Auto-update status ACTIVE → EXPIRED khi hết hạn
- Hiện tại: Update manual hoặc check khi render

---

### 7. Gia Hạn OrderItem
**Kịch bản**: Khách muốn gia hạn textlink cũ

**Flow**:
1. Vào `/orders/:id`
2. Chọn các OrderItems muốn gia hạn (checkbox)
3. Nhấn "Gia hạn"
4. System:
   - Lấy giá mới nhất từ TextlinkPrice
   - Copy tất cả entries từ OrderItem cũ
   - Tạo Order mới với OrderItems mới
   - startDate = now(), endDate = startDate + duration
5. Redirect về `/orders` để xem đơn mới

---

## 📦 Dependencies

### Production
```json
{
  "@prisma/client": "^7.4.2",        // Prisma ORM
  "@prisma/adapter-pg": "^7.4.2",    // PostgreSQL adapter
  "next": "16.1.6",                  // Next.js framework
  "next-auth": "^4.24.13",           // Authentication
  "react": "19.2.3",                 // React
  "react-dom": "19.2.3",             // React DOM
  "bcryptjs": "^3.0.3",              // Password hashing
  "date-fns": "^4.1.0",              // Date utilities
  "exceljs": "^4.4.0",               // Excel export
  "lucide-react": "^0.577.0",        // Icons
  "pg": "^8.20.0",                   // PostgreSQL client
  "recharts": "^3.8.0"               // Charts
}
```

### Development
```json
{
  "prisma": "^7.4.2",                // Prisma CLI
  "typescript": "^5",                // TypeScript
  "tailwindcss": "^4",               // CSS framework
  "@tailwindcss/postcss": "^4",     // PostCSS plugin
  "eslint": "^9",                    // Linter
  "tsx": "^4.21.0"                   // TypeScript executor
}
```

---

## 🚀 Setup & Deployment

### Environment Variables (.env)
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/xanh_seo"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

### Setup Commands
```bash
# Install dependencies
npm install

# Setup database
npx prisma migrate dev

# Seed database (optional)
npm run seed

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## 🔄 Data Flow Examples

### Example 1: Tạo Đơn Hàng
```
User: Navigate to /orders/create
  ↓
Step 1: Select customer "Nguyễn Văn A"
  ↓
Step 2: Add 2 items:
  - Website A (HOMEPAGE, 1M, $30) with 13 entries
  - Website B (FOOTER, 1M, $25) with 7 entries
  ↓
Step 3: Set discount 10%, Review summary
  ↓
Click "Tạo đơn hàng"
  ↓
POST /api/orders with:
  {
    customerId: "...",
    discount: 10,
    items: [
      { websiteId: "...", unitPrice: 30, entries: [13 objects] },
      { websiteId: "...", unitPrice: 25, entries: [7 objects] }
    ]
  }
  ↓
API creates:
  - 1 Order (discount=10)
  - 2 OrderItems
  - 20 TextlinkEntries (13 + 7)
  ↓
Redirect to /orders
  ↓
User sees new order in table:
  - 20 links
  - $508.50 total
```

---

### Example 2: Gia Hạn OrderItem
```
User: Navigate to /orders/:id
  ↓
Select 2 OrderItems (checkbox)
  ↓
Click "Gia hạn"
  ↓
POST /api/orders/:id/renew with:
  { itemIds: ["item1", "item2"] }
  ↓
API:
  1. Fetch original OrderItems with entries
  2. Get latest prices from TextlinkPrice
  3. Create new Order (discount=0, paymentStatus=ORDERED)
  4. Create 2 new OrderItems with:
     - New startDate, endDate
     - Copy all entries from original
  ↓
Redirect to /orders
  ↓
User sees new renewal order
```

---

### Example 3: Sửa Entries
```
User: Navigate to /orders/:id
  ↓
Click "Sửa" button on OrderItemCard
  ↓
EditEntriesModal opens with current entries:
  Left textarea: "Anchor 1\nAnchor 2\n..."
  Right textarea: "https://url1.com\nhttps://url2.com\n..."
  ↓
User edits:
  - Add 2 new lines
  - Delete 1 line
  - Modify 3 anchors
  ↓
Modal validates: 12 anchors = 12 URLs ✓
  ↓
Click "Lưu thay đổi"
  ↓
PUT /api/orders/:id/items/:itemId/entries with:
  { entries: [12 new entry objects] }
  ↓
API (atomic transaction):
  - DELETE all old entries (was 11)
  - CREATE 12 new entries
  ↓
Modal closes, page refetches data
  ↓
User sees updated OrderItemCard with 12 entries
```

---

## 🐛 Known Issues & Limitations

### Current Limitations:
1. **No Automatic Status Update**: OrderItem status không tự động chuyển từ ACTIVE → EXPIRED
   - Workaround: Manual update hoặc check khi render

2. **No Entry Validation**: URLs không được validate (format, reachability)
   - Risk: User có thể nhập URL sai

3. **No Duplicate Detection**: Có thể tạo nhiều entries với cùng anchor/URL

4. **No Undo**: Sửa entries không có undo/history

5. **No Partial Entry Edit**: Phải replace toàn bộ entries, không edit từng entry riêng lẻ

6. **TypeScript Warnings**: Một số chỗ dùng `as any` để bypass type checking (do Prisma Client chưa generate đủ)

---

## 🔮 Future Enhancements (Ideas)

### Short-term:
- [ ] Auto-update OrderItem status với cron job
- [ ] URL validation trong EditEntriesModal
- [ ] Inline entry editing (không cần modal)
- [ ] Entry history tracking
- [ ] Duplicate detection

### Mid-term:
- [ ] Advanced filtering & search (theo domain, DR range, giá range)
- [ ] Bulk actions (delete multiple, update multiple)
- [ ] Email notifications (đơn sắp hết hạn, thanh toán thành công)
- [ ] Customer portal (khách xem đơn hàng của mình)
- [ ] API rate limiting & caching

### Long-term:
- [ ] Multi-currency support
- [ ] Invoice generation (PDF)
- [ ] Payment gateway integration (Stripe, PayPal)
- [ ] Automated textlink placement (API to websites)
- [ ] SEO performance tracking (check if textlinks are live)
- [ ] Multi-user roles & permissions
- [ ] Activity logs & audit trail

---

## 📚 Additional Documentation

### Related Files:
- [PRICING_AND_DISCOUNT_UPDATE.md](PRICING_AND_DISCOUNT_UPDATE.md) - Chi tiết update logic tính tiền & discount
- [ORDERDETAIL_UI_UPDATE.md](ORDERDETAIL_UI_UPDATE.md) - Chi tiết update UI OrderDetail page
- [SETUP.md](SETUP.md) - Hướng dẫn cài đặt (nếu có)
- [STATUS.md](STATUS.md) - Trạng thái dự án (nếu có)

---

## 📞 Support & Maintenance

### Database Maintenance:
```bash
# View database schema
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Generate Prisma Client (after schema changes)
npx prisma generate

# Create new migration
npx prisma migrate dev --name migration_name
```

### Common Issues:

**Issue**: "Prisma Client not generated"
```bash
npx prisma generate
```

**Issue**: "Cannot find module '@prisma/client'"
```bash
npm install @prisma/client
npx prisma generate
```

**Issue**: "Migration failed due to permissions"
- Grant CREATEDB permission to PostgreSQL user
- OR use `npx prisma db push` instead

---

## 🎯 System Highlights

### What Makes This System Unique:
1. **Flexible Textlink Entries**: Mỗi OrderItem có thể có nhiều entries (không giới hạn)
2. **Bulk Entry Editing**: 2 textareas để edit nhanh hàng chục links cùng lúc
3. **Visual Monitoring**: Màu sắc + pulse animations cảnh báo expiring/expired
4. **Accurate Pricing**: Tính đúng theo entries × unitPrice với discount %
5. **Renewal Flow**: Copy toàn bộ entries khi gia hạn, không cần nhập lại
6. **Comprehensive Reports**: Doanh thu & lợi nhuận theo website, customer, thời gian
7. **Professional UI**: Dark theme inspired by Binance, responsive, modern

---

**Document Version**: 1.0
**Last Updated**: 2026-03-10
**Author**: Claude + Peter
**Project Status**: ✅ Production Ready (with minor limitations)
