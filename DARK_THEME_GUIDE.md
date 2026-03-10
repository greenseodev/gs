# 🌙 Dark Crypto Theme Guide

## 🎨 Color Palette

### Background & Surfaces
```css
--background: #0b0e11      /* Main dark background */
--card: #181a20            /* Card/Panel background */
--card-hover: #1e2329      /* Card hover state */
```

### Borders
```css
--border: #2b3139          /* Default border */
--border-light: #474d57    /* Lighter border for emphasis */
```

### Primary (Gold/Yellow - Crypto accent)
```css
--primary: #fcd535         /* Main accent - Binance yellow */
--primary-dark: #f0b90b    /* Darker variant */
```

### Secondary (Green - Success)
```css
--secondary: #0ecb81       /* Success/Profit green */
--secondary-dark: #0bb871  /* Darker green */
```

### Status Colors
```css
--success: #0ecb81         /* Green - Positive */
--danger: #f6465d          /* Red - Negative */
--warning: #f0b90b         /* Yellow - Warning */
--info: #5b8def            /* Blue - Info */
```

### Text Colors
```css
--text-primary: #eaecef    /* Main text */
--text-secondary: #b7bdc6  /* Secondary text */
--text-muted: #848e9c      /* Muted/disabled text */
```

## 📦 Pre-built Classes

### Glass Morphism
```tsx
<div className="glass">
  // Glassmorphism effect with blur
</div>
```

### Glow Effects
```tsx
<div className="glow-primary">Yellow glow</div>
<div className="glow-success">Green glow</div>
<div className="glow-danger">Red glow</div>
```

### Animations
```tsx
<div className="shimmer">Loading shimmer</div>
<div className="pulse-glow">Pulsing glow</div>
<div className="card-hover">Hover lift effect</div>
```

## 🎯 Component Examples

### Card Component
```tsx
<div className="bg-[#181a20] border border-[#2b3139] rounded-xl p-6 card-hover">
  <h3 className="text-[#eaecef] font-semibold mb-2">Title</h3>
  <p className="text-[#b7bdc6] text-sm">Description</p>
</div>
```

### Primary Button
```tsx
<button className="bg-[#fcd535] hover:bg-[#f0b90b] text-[#0b0e11] px-6 py-3 rounded-lg font-semibold transition-all glow-primary">
  Action
</button>
```

### Success Button (Green)
```tsx
<button className="bg-[#0ecb81] hover:bg-[#0bb871] text-white px-6 py-3 rounded-lg font-semibold transition-all glow-success">
  Confirm
</button>
```

### Danger Button (Red)
```tsx
<button className="bg-[#f6465d] hover:bg-[#c9374a] text-white px-6 py-3 rounded-lg font-semibold transition-all glow-danger">
  Delete
</button>
```

### Secondary Button (Outline)
```tsx
<button className="border border-[#2b3139] hover:border-[#fcd535] text-[#eaecef] px-6 py-3 rounded-lg font-semibold transition-all">
  Cancel
</button>
```

### Input Field
```tsx
<input
  className="w-full bg-[#0b0e11] border border-[#2b3139] focus:border-[#fcd535] text-[#eaecef] px-4 py-3 rounded-lg placeholder:text-[#848e9c]"
  placeholder="Enter value..."
/>
```

### Badge/Tag
```tsx
{/* Success */}
<span className="bg-[#0ecb81]/10 border border-[#0ecb81]/20 text-[#0ecb81] px-3 py-1 rounded-md text-xs font-semibold">
  PAID
</span>

{/* Warning */}
<span className="bg-[#f0b90b]/10 border border-[#f0b90b]/20 text-[#f0b90b] px-3 py-1 rounded-md text-xs font-semibold">
  PENDING
</span>

{/* Danger */}
<span className="bg-[#f6465d]/10 border border-[#f6465d]/20 text-[#f6465d] px-3 py-1 rounded-md text-xs font-semibold">
  UNPAID
</span>
```

### Stats Card
```tsx
<div className="bg-[#181a20] border border-[#2b3139] rounded-xl p-6 card-hover">
  <div className="flex items-center justify-between mb-4">
    <span className="text-[#848e9c] text-sm">Doanh thu</span>
    <TrendingUp size={20} className="text-[#0ecb81]" />
  </div>
  <div className="text-[#eaecef] text-3xl font-bold mb-2">
    $12,543.50
  </div>
  <div className="text-[#0ecb81] text-sm font-semibold">
    +12.5% vs tháng trước
  </div>
</div>
```

### Table
```tsx
<div className="bg-[#181a20] border border-[#2b3139] rounded-xl overflow-hidden">
  <table className="w-full">
    <thead className="bg-[#0b0e11] border-b border-[#2b3139]">
      <tr>
        <th className="px-6 py-4 text-left text-xs font-semibold text-[#848e9c] uppercase">
          Column
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-[#2b3139]">
      <tr className="hover:bg-[#1e2329] transition-colors">
        <td className="px-6 py-4 text-sm text-[#eaecef]">
          Data
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### Modal/Dialog
```tsx
<div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
  <div className="bg-[#181a20] border border-[#2b3139] rounded-2xl p-8 w-full max-w-md shadow-2xl">
    <h2 className="text-[#eaecef] text-2xl font-bold mb-6">Modal Title</h2>
    <p className="text-[#b7bdc6] mb-8">Modal content...</p>
    <div className="flex gap-4">
      <button className="flex-1 bg-[#fcd535] hover:bg-[#f0b90b] text-[#0b0e11] py-3 rounded-lg font-semibold">
        Confirm
      </button>
      <button className="flex-1 border border-[#2b3139] hover:border-[#474d57] text-[#eaecef] py-3 rounded-lg font-semibold">
        Cancel
      </button>
    </div>
  </div>
</div>
```

### Price Display (Crypto style)
```tsx
{/* Positive */}
<div className="text-[#0ecb81] text-2xl font-bold font-mono">
  +$1,234.56
  <span className="text-sm ml-2">+5.67%</span>
</div>

{/* Negative */}
<div className="text-[#f6465d] text-2xl font-bold font-mono">
  -$234.56
  <span className="text-sm ml-2">-2.34%</span>
</div>
```

### Progress Bar
```tsx
<div className="w-full h-2 bg-[#2b3139] rounded-full overflow-hidden">
  <div
    className="h-full bg-gradient-to-r from-[#fcd535] to-[#f0b90b] rounded-full transition-all"
    style={{ width: '75%' }}
  />
</div>
```

### Chart Container
```tsx
<div className="bg-[#181a20] border border-[#2b3139] rounded-xl p-6">
  <div className="flex items-center justify-between mb-6">
    <h3 className="text-[#eaecef] font-semibold text-lg">Chart Title</h3>
    <select className="bg-[#0b0e11] border border-[#2b3139] text-[#eaecef] px-3 py-2 rounded-lg text-sm">
      <option>24H</option>
      <option>7D</option>
      <option>1M</option>
    </select>
  </div>
  {/* Chart component here */}
</div>
```

## 🔥 Advanced Patterns

### Gradient Button
```tsx
<button className="bg-gradient-to-r from-[#fcd535] to-[#f0b90b] hover:from-[#f0b90b] hover:to-[#fcd535] text-[#0b0e11] px-6 py-3 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all">
  Gradient Action
</button>
```

### Neon Border Card
```tsx
<div className="relative bg-[#181a20] rounded-xl p-6 overflow-hidden group">
  <div className="absolute inset-0 bg-gradient-to-r from-[#fcd535] to-[#0ecb81] opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
  <div className="relative bg-[#181a20] border border-[#2b3139] rounded-xl p-6">
    Content
  </div>
</div>
```

### Glass Panel (Floating)
```tsx
<div className="glass rounded-2xl p-8 shadow-2xl">
  <h3 className="text-[#eaecef] text-xl font-bold mb-4">Glass Panel</h3>
  <p className="text-[#b7bdc6]">Floating glass effect</p>
</div>
```

## 🎭 Icon Colors

```tsx
// Success/Profit
<TrendingUp className="text-[#0ecb81]" />

// Loss/Danger
<TrendingDown className="text-[#f6465d]" />

// Warning/Alert
<AlertTriangle className="text-[#f0b90b]" />

// Info
<Info className="text-[#5b8def]" />

// Primary action
<Plus className="text-[#fcd535]" />

// Muted/Secondary
<Settings className="text-[#848e9c]" />
```

## 💡 Tips

1. **Always use semi-transparent backgrounds** for overlays:
   - `bg-black/80` for dark overlays
   - `bg-[#181a20]/90` for card overlays

2. **Layer borders** for depth:
   ```tsx
   <div className="border border-[#2b3139] hover:border-[#fcd535]">
   ```

3. **Use glow for emphasis**:
   ```tsx
   <button className="glow-primary">Important Action</button>
   ```

4. **Monospace fonts for numbers**:
   ```tsx
   <span className="font-mono">$1,234.56</span>
   ```

5. **Hover states are important**:
   - Always add `hover:` states
   - Use `transition-all` for smooth animations
   - Consider `card-hover` class for lift effect

## 🌐 Color Reference

| Color | Hex | Usage |
|-------|-----|-------|
| Yellow | `#fcd535` | Primary actions, highlights |
| Green | `#0ecb81` | Success, profit, positive |
| Red | `#f6465d` | Danger, loss, negative |
| Orange | `#f0b90b` | Warning, pending |
| Blue | `#5b8def` | Info, links |
| Dark BG | `#0b0e11` | Main background |
| Card BG | `#181a20` | Cards, panels |
| Border | `#2b3139` | Default borders |
| Text | `#eaecef` | Primary text |
| Muted | `#848e9c` | Secondary text |

---

**Áp dụng theme này để có giao diện crypto hiện đại như Binance, Coinbase, FTX!** 🚀
