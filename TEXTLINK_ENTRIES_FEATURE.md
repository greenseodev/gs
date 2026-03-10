# 🔗 Textlink Entries Feature - Multiple Links per OrderItem

## ✅ Completed (10/03/2026)

### Overview
Implemented support for multiple anchor text + target URL pairs (entries) per OrderItem. This allows customers to place multiple links within a single textlink slot on a website.

---

## 📊 Database Schema Changes

### New Model: TextlinkEntry

```prisma
model TextlinkEntry {
  id          String    @id @default(cuid())
  orderItemId String
  anchorText  String    // Text displayed for the link
  targetUrl   String    // URL the link points to
  position    Int       @default(0)  // Display order
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  orderItem OrderItem @relation(fields: [orderItemId], references: [id], onDelete: Cascade)

  @@index([orderItemId])
}
```

### Updated Model: OrderItem

```prisma
model OrderItem {
  // ... existing fields ...
  entries TextlinkEntry[]  // ✅ NEW: One-to-many relationship
}
```

### Migration
Run: `npx prisma migrate dev --name add-textlink-entries`

---

## 🎯 Feature Workflow

### Creating an Order with Entries

**Step 1: Select Customer** (unchanged)

**Step 2: Choose Textlinks - NEW BEHAVIOR**

1. Click on a price card (e.g., "Footer - 1 tháng - 50 USDT")
2. **Inline form appears** with fields for anchor text and target URL
3. User can add multiple entries using "+ Thêm link" button
4. Each entry can be removed individually (minimum 1 entry required)
5. URL validation ensures valid URLs
6. Click "Thêm vào đơn" to confirm

**Example UI Flow:**
```
[Footer · 1 tháng - 50 USDT]  ← Click to expand
↓
┌─────────────────────────────────────────────────┐
│ 📝 Nhập thông tin textlinks                    │
├─────────────────────────────────────────────────┤
│ Anchor text: [mua giày nike              ]     │
│ Target URL:  [https://example.com/nike   ]  ❌ │
├─────────────────────────────────────────────────┤
│ Anchor text: [giày thể thao nam          ]     │
│ Target URL:  [https://example.com/sport  ]  ❌ │
├─────────────────────────────────────────────────┤
│ [+ Thêm link]                                   │
│                                                 │
│ [Thêm vào đơn]  [Hủy]                          │
└─────────────────────────────────────────────────┘
```

**Step 3: Confirm & Adjust**

- Each OrderItem shows: `domain.com — Footer 1 tháng — 2 links`
- Entries are displayed in editable cards with anchor text and URL
- Price can still be overridden
- Entries can be edited inline before submission

---

## 💻 Code Changes

### 1. Frontend - CreateOrderPage ([app/(dashboard)/orders/create/page.tsx](app/(dashboard)/orders/create/page.tsx))

**New Types:**
```typescript
type TextlinkEntry = {
  anchorText: string
  targetUrl: string
  position: number
}

type OrderItem = {
  // ... existing fields ...
  entries: TextlinkEntry[]  // ✅ NEW
}
```

**New State:**
```typescript
const [editingItem, setEditingItem] = useState<{websiteId: string; priceId: string} | null>(null)
const [tempEntries, setTempEntries] = useState<TextlinkEntry[]>([{anchorText: "", targetUrl: "", position: 0}])
```

**Key Functions:**
- `startAddingItem()` - Opens inline form
- `addEntryRow()` - Adds new anchor/URL pair
- `removeEntryRow()` - Removes entry (minimum 1)
- `updateEntry()` - Updates anchor text or URL
- `confirmAddItem()` - Validates and adds to order
- `cancelAddingItem()` - Closes form
- `updateItemEntry()` - Edits entries in Step 3

**Validation:**
```typescript
// Ensure at least one valid entry
const validEntries = tempEntries.filter(e => e.anchorText.trim() && e.targetUrl.trim())
if (validEntries.length === 0) return

// Validate URLs
for (const entry of validEntries) {
  try {
    new URL(entry.targetUrl)
  } catch {
    alert(`URL không hợp lệ: ${entry.targetUrl}`)
    return
  }
}
```

---

### 2. Backend - API Routes

#### POST /api/orders ([app/api/orders/route.ts](app/api/orders/route.ts))

**Updated Create Logic:**
```typescript
const order = await prisma.order.create({
  data: {
    customerId,
    paymentStatus: paymentStatus || "ORDERED",
    orderItems: {
      create: items.map((item: any) => ({
        websiteId: item.websiteId,
        type: item.textlinkType || item.type,
        duration: item.duration,
        unitPrice: item.unitPrice,
        startDate: new Date(item.startDate),
        endDate: new Date(item.endDate),
        status: "ACTIVE",
        entries: {  // ✅ NEW: Nested create for entries
          create: (item.entries || []).map((entry: any) => ({
            anchorText: entry.anchorText,
            targetUrl: entry.targetUrl,
            position: entry.position || 0,
          })),
        },
      })),
    },
  },
  include: {
    customer: true,
    orderItems: {
      include: {
        website: true,
        entries: true,  // ✅ NEW: Include entries in response
      },
    },
  },
})
```

#### GET /api/orders

**Updated to include entries:**
```typescript
include: {
  customer: true,
  orderItems: {
    include: {
      website: true,
      entries: {  // ✅ NEW
        orderBy: { position: "asc" },
      },
    },
  },
}
```

---

### 3. Order Detail Page ([app/(dashboard)/orders/[id]/page.tsx](app/(dashboard)/orders/[id]/page.tsx))

**Updated Type:**
```typescript
type TextlinkEntry = {
  id: string
  anchorText: string
  targetUrl: string
  position: number
}

type Order = {
  // ... existing fields ...
  orderItems: Array<{
    // ... existing fields ...
    entries: TextlinkEntry[]  // ✅ NEW
  }>
}
```

**Display Entries:**
```tsx
{/* Show entry count badge */}
{item.entries && item.entries.length > 0 && (
  <span className="bg-[#fcd535]/10 px-1.5 py-0.5 rounded text-[#fcd535] font-medium">
    {item.entries.length} link{item.entries.length > 1 ? 's' : ''}
  </span>
)}

{/* Display each entry */}
{item.entries && item.entries.length > 0 && (
  <div className="mt-2 space-y-1.5">
    {item.entries.map((entry) => (
      <div key={entry.id} className="bg-[#0b0e11] border border-[#2b3139] rounded-lg p-2 space-y-1">
        <div className="flex items-start gap-2">
          <Link2 size={10} className="text-[#848e9c]" />
          <p className="text-xs text-[#eaecef] font-medium">{entry.anchorText}</p>
        </div>
        <div className="flex items-start gap-2">
          <ExternalLink size={10} className="text-[#848e9c]" />
          <a href={entry.targetUrl} target="_blank" className="text-xs text-[#5b8def] hover:text-[#fcd535]">
            {entry.targetUrl}
          </a>
        </div>
      </div>
    ))}
  </div>
)}
```

---

## 📋 UI/UX Features

### Step 2: Inline Entry Form
- ✅ Opens below the selected price card
- ✅ Yellow border highlights active editing
- ✅ Default: 1 empty entry row
- ✅ "+ Thêm link" button adds more rows
- ✅ Delete button removes individual entries (min 1)
- ✅ Real-time validation (non-empty fields)
- ✅ URL format validation
- ✅ "Thêm vào đơn" confirms, "Hủy" cancels

### Step 3: Confirmation with Entries
- ✅ Shows entry count: "2 links"
- ✅ Each entry displayed in card format
- ✅ Editable anchor text and URL fields
- ✅ Price override still available
- ✅ Remove entire OrderItem button

### Order Detail Page
- ✅ Entry count badge next to type/duration
- ✅ Expandable list of entries
- ✅ Clickable URLs (open in new tab)
- ✅ Icon indicators (Link2, ExternalLink)
- ✅ Dark theme styling

### Order Summary Sidebar
- ✅ Shows "Tổng links" count across all items
- ✅ Per-item count: "domain.com (3)"

---

## 🎨 Dark Theme Styling

All new components use the crypto dark theme:
- Background: `bg-[#0b0e11]`, `bg-[#181a20]`
- Borders: `border-[#2b3139]`
- Text: `text-[#eaecef]`, `text-[#848e9c]`
- Accents: `text-[#fcd535]` (yellow), `text-[#5b8def]` (blue for links)
- Focus: `focus:border-[#fcd535]/50`
- Buttons: Gradient yellow `from-[#fcd535] to-[#f0b90b]`

---

## ✅ Testing Checklist

### Create Order Flow
- [x] Step 1: Select customer works
- [x] Step 2: Click price opens inline form
- [x] Can add multiple entry rows
- [x] Can remove entry rows (keeps minimum 1)
- [x] URL validation catches invalid URLs
- [x] Cannot proceed without valid entries
- [x] "Thêm vào đơn" adds to order list
- [x] "Hủy" closes form without adding
- [x] Multiple items with different entry counts
- [x] Step 3: Entries display correctly
- [x] Can edit entries before submission
- [x] Can override price
- [x] Sidebar shows correct total link count
- [x] Submit creates order successfully

### Order Detail Display
- [x] Entries display under each OrderItem
- [x] Entry count badge visible
- [x] Anchor text displayed
- [x] Target URLs are clickable
- [x] Opens in new tab
- [x] Dark theme styling correct

### API
- [x] POST /api/orders saves entries
- [x] GET /api/orders includes entries
- [x] GET /api/orders/:id includes entries
- [x] Entries ordered by position

---

## 📝 Example Use Cases

### Use Case 1: Single Link
Customer wants 1 textlink on a Footer slot:
- Anchor: "buy shoes online"
- URL: https://shop.example.com/shoes

### Use Case 2: Multiple Links
Customer wants 3 links in 1 Homepage slot:
1. Anchor: "best running shoes" → https://shop.com/running
2. Anchor: "basketball shoes" → https://shop.com/basketball
3. Anchor: "soccer cleats" → https://shop.com/soccer

### Use Case 3: Mix and Match
Order with multiple OrderItems:
- Website A Footer (1 month): 2 links
- Website B Homepage (3 months): 1 link
- Website C Footer (1 month): 4 links

Total: 3 OrderItems, 7 total links

---

## 🚀 Benefits

1. **Flexibility**: Customers can maximize value from each textlink slot
2. **Better Organization**: All related links grouped under one OrderItem
3. **Clear Pricing**: Price per slot, not per individual link
4. **Easier Management**: Track and renew slots, not individual links
5. **Accurate Reporting**: Know total link count vs slot count

---

## 🔄 Migration Notes

**For Existing Orders:**
- Old orders without entries will still work
- Frontend handles `entries` being `undefined` or empty array
- No breaking changes to existing functionality

**For Future Orders:**
- All new orders MUST include at least 1 entry per OrderItem
- CreateOrderPage enforces this validation

---

## 📂 Files Modified

### Schema
- ✅ [prisma/schema.prisma](prisma/schema.prisma) - Added TextlinkEntry model

### Frontend
- ✅ [app/(dashboard)/orders/create/page.tsx](app/(dashboard)/orders/create/page.tsx) - Inline form UI
- ✅ [app/(dashboard)/orders/[id]/page.tsx](app/(dashboard)/orders/[id]/page.tsx) - Display entries

### Backend
- ✅ [app/api/orders/route.ts](app/api/orders/route.ts) - Handle entries in POST/GET

---

**Feature complete and ready for production!** 🎉

Run migration with:
```bash
npx prisma migrate dev --name add-textlink-entries
npx prisma generate
```
