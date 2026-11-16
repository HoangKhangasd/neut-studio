# TÀI LIỆU ĐẶC TẢ HỆ THỐNG E-COMMERCE THỜI TRANG (NEUT-STUDIO) - VERSION 3.0
## HỢP NHẤT: BACKEND ENTERPRISE + UI/UX STREETWEAR MONOCHROME (DIRTYCOINS INSPIRATION)

---

## MỤC LỤC
1. [Triết Lý Thiết Kế UI/UX & Design System (DirtyCoins Reference)](#1-triết-lý-thiết-kế-uiux--design-system)
2. [Chi Tiết Các Thành Phần Toàn Cục (Header, MegaMenu, Quick Search, Footer)](#2-chi-tiết-các-thành-phần-toàn-cục)
3. [Đặc Tả Component Thẻ Sản Phẩm Chuẩn Streetwear (`ProductCard`)](#3-đặc-tả-component-thẻ-sản-phẩm-chuẩn-streetwear)
4. [Đặc Tả Luồng Tương Tác Chi Tiết Các Trang (Home, Shop, PDP, Lookbook)](#4-đặc-tả-luồng-tương-tác-chi-tiết-các-trang)
5. [Cơ Sở Dữ Liệu Drizzle ORM Cập Nhật Bổ Sung UI](#5-cơ-sở-dữ-liệu-drizzle-orm-cập-nhật-bổ-sung-ui)
6. [Cấu Trúc Thư Mục Monorepo Hoàn Chỉnh (BE + FE)](#6-cấu-trúc-thư-mục-monorepo-hoàn-chỉnh)
7. [Lộ Trình Triển Khai Thực Chiến](#7-lộ-trình-triển-khai-thực-chiến)

---

## 1. TRIẾT LÝ THIẾT KẾ UI/UX & DESIGN SYSTEM

Giao diện **Neut-Studio** được thiết kế theo phong cách **High-Contrast Monochrome Streetwear** tương tự [DirtyCoins Official Storefront](https://dirtycoins.vn/):
- **Tương phản cực đại:** Tông màu Đen - Trắng chủ đạo, đường nét góc cạnh sắc bén (`rounded-none` hoặc tối đa `rounded-sm 2px`), tuyệt đối không dùng bo tròn mềm mại để giữ trọn chất đường phố khỏe khoắn.
- **Typography:** Font Geometric Sans-serif (Inter / Plus Jakarta Sans) kết hợp `uppercase` và `tracking-wider` cho tiêu đề và nút CTA.
- **Tỉ lệ hình ảnh:** Ảnh sản phẩm chuẩn tỉ lệ $1:1$ (`1024x1024`), ảnh Lookbook chuẩn tỉ lệ $4:5$ hoặc $16:9$. Nền khung ảnh phụ dùng `#F5F5F5` để làm nổi bật áo thun trắng.

### Bảng Tokens Màu Hệ Thống:
| Token Name | Hex Code | Vai trò hiển thị | Tailwind Class |
| :--- | :--- | :--- | :--- |
| **Brand Black** | `#000000` | Nút CTA chính (`MUA NGAY`), Header/Footer đậm, Badge `Collab` | `bg-black text-white` |
| **Text Primary** | `#111111` | Tiêu đề sản phẩm, giá bán, MegaMenu | `text-neutral-900` |
| **Surface Secondary** | `#F5F5F5` | Nền khung ảnh sản phẩm, khối khám phá | `bg-neutral-100` |
| **Text Muted** | `#737373` | Size hết hàng, breadcrumb, chính sách phụ | `text-neutral-500` |
| **Accent Red** | `#DC2626` | Nhãn giảm giá, cảnh báo hết hàng, lỗi validate SĐT | `text-red-600` / `bg-red-600` |
| **Border Divider** | `#E5E5E5` | Viền ô chọn Size (`S`, `M`), đường chia cột | `border-neutral-200` |

---

## 2. CHI TIẾT CÁC THÀNH PHẦN TOÀN CỤC

### 2.1. Header Sticky & Mega Menu Đa Cấp
- **Bố cục Sticky:** `sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-neutral-200`.
- **Cấu trúc Mega Menu (Hover mở rộng toàn màn hình):**
  - **Shop:**
    - *Tops:* T-shirts & Polo Shirts, Jerseys, Shirts, Sweaters & Cardigans, Sweatshirts & Hoodies, Outerwear.
    - *Bottoms:* Pants, Shorts, Denim.
    - *Accessories:* Caps/Hats, Slides, Phone cases, Wallets, Underwear.
    - *Bags:* Backpacks, Crossbody bags, Bowler bags.
    - *Womenswear.*
  - **Collections:**
    - *Collaborations:* Dragon Ball Z, One Piece, Astro Boy.
    - *DICO Collections:* Blokecore, Heritages, All-Star.
  - **Liên kết nhanh:** News / Blog, About Us, Hệ thống cửa hàng.
- **Action Icons bên phải:**
  - Kính lúp: Mở Instant Search Drawer.
  - Icon User: Đăng nhập / Hồ sơ cá nhân.
  - Icon Cart: Kèm Badge số lượng đơn vị, click mở Mini-Cart Drawer trượt bên phải.

### 2.2. Khung Tìm Kiếm Tức Thì (Instant Search Overlay)
- Trượt từ trên xuống hoặc mở Drawer toàn màn hình:
  - **Search Input:** Tự động autofocus, debounce $300\text{ms}$ gọi API tìm kiếm.
  - **Popular Searches:** Tag bấm nhanh: `Tops`, `Bottoms`, `Denim`, `Hoodie`, `Bags`.
  - **Suggested Grid:** Hiển thị tức thì 5 sản phẩm nổi bật ngay cả khi chưa gõ từ khóa.

### 2.3. Ngăn Giỏ Hàng Trượt (Mini-Cart Drawer)
- Sử dụng `shadcn/ui` `Sheet` (`side="right"`):
  - Danh sách sản phẩm trong giỏ: Ảnh thumbnail theo màu, tên sản phẩm, size/màu, bộ tăng giảm số lượng `[-] [1] [+]`, nút xóa.
  - Sticky Footer: Tổng tiền tạm tính bằng VNĐ (`bigint`), nút `THANH TOÁN NGAY` dẫn sang `/checkout`.

### 2.4. Khối Thu Thập SĐT ("Join The Movement") & Footer 4 Cột
- **Banner "Join the Movement":** Ngay phía trên Footer ở mọi trang. Khách nhập Số điện thoại để nhận voucher 10% Off. Validate Regex định dạng SĐT Việt Nam:
  - Thông báo inline tại chỗ: *"Vui lòng nhập số điện thoại"*, *"Số điện thoại không đúng định dạng"*, *"Cảm ơn bạn đã đăng ký theo dõi"*.
- **Footer 4 Cột:**
  - Cột 1: Chính sách (Thẻ thành viên, Bảo hành 3-6 tháng, Đổi trả 7-15 ngày, Vận chuyển, Kiểm hàng).
  - Cột 2: Hỗ trợ (FAQ, Hướng dẫn chọn size, Hướng dẫn bảo quản, Hệ thống chi nhánh).
  - Cột 3: Tài khoản & Theo dõi đơn hàng.
  - Cột 4: Hệ thống cửa hàng vật lý tại TP.HCM, Hà Nội, Hải Phòng + Hotline + Logo Bộ Công Thương.

---

## 3. ĐẶC TẢ COMPONENT THẺ SẢN PHẨM CHUẨN STREETWEAR (`ProductCard`)

```text
+---------------------------------------+
| [New Arrivals] [Collab]           ♥ 0 |  <-- Lớp 1: Badges + Wishlist Button
|                                       |
|                                       |
|           ẢNH SẢN PHẨM 1:1            |  <-- Lớp 2: Ảnh chính (Hover lật sang ảnh mặt sau)
|       (Hover hiện: Xem nhanh)         |             Nền bg-neutral-100
|                                       |
+---------------------------------------+
|          S   M   L   XL   XXL         |  <-- Lớp 3: Quick Size Bar (gạch ngang nếu hết)
+---------------------------------------+
| Áo Thun DCxAB Battle Overprint        |  <-- Lớp 4: Tên SP (line-clamp-1, hover underline)
| 950.000 VND                           |  <-- Lớp 5: Giá bán in đậm (kèm giá cũ gạch ngang)
+---------------------------------------+
```

---

## 4. ĐẶC TẢ LUỒNG TƯƠNG TÁC CHI TIẾT CÁC TRANG

- **Trang chủ (`/`):** Hero Lookbook Carousel, New Arrivals với thanh Tab chuyển danh mục lọc tại chỗ (không reload trang), Bento Category Discovery.
- **Trang danh sách (`/shop`):** Breadcrumb, Active filter tags, Faceted Filter Drawer (Size chữ/số/freesize, màu sắc swatch, 5 khoảng giá, 9 kiểu sắp xếp).
- **Trang chi tiết (`/products/[slug]`):** 
  - Cột trái: Media gallery đồng bộ theo màu được chọn, zoom lightbox chất liệu vải.
  - Cột phải (Sticky Buy Box): Giá VNĐ, chọn màu, chọn size, nút mở modal Smart Fit Finder, nút MUA NGAY / THÊM VÀO GIỎ, 3 Drawers thông tin: Chi tiết & Size Chart, Chính sách & Hạng thẻ, Cửa hàng còn hàng.
  - Cuối trang: Shop By Look & Gợi ý sản phẩm liên quan.
- **Trang Lookbook (`/lookbooks`):** Shop The Look với các điểm Hotspot $(x\%, y\%)$ click để xem sản phẩm và mua nguyên set.

---

## 5. CƠ SỞ DỮ LIỆU DRIZZLE ORM CẬP NHẬT BỔ SUNG UI

```typescript
// Bảng Chi Nhánh Cửa Hàng & Tồn Kho (Dùng cho Drawer "Cửa hàng còn hàng" trên PDP)
export const stores = pgTable('stores', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 150 }).notNull(),
  address: varchar('address', { length: 255 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  isActive: boolean('is_active').default(true).notNull(),
});

export const storeInventories = pgTable('store_inventories', {
  id: uuid('id').defaultRandom().primaryKey(),
  storeId: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  variantId: uuid('variant_id').notNull().references(() => productVariants.id, { onDelete: 'cascade' }),
  stockQuantity: integer('stock_quantity').notNull().default(0),
}, (table) => [
  uniqueIndex('idx_store_variant_stock').on(table.storeId, table.variantId),
]);

// Bảng Khách Hàng Đăng Ký SĐT (Dùng cho Banner "Join the Movement" 10% Off)
export const newsletterLeads = pgTable('newsletter_leads', {
  id: uuid('id').defaultRandom().primaryKey(),
  phone: varchar('phone', { length: 20 }).notNull().unique(),
  discountCodeSent: varchar('discount_code_sent', { length: 50 }),
  isUsed: boolean('is_used').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

---

## 6. CẤU TRÚC THƯ MỤC MONOREPO HOÀN CHỈNH

```text
Neut-Studio/
├── docker-compose.yml              # PostgreSQL 16, MinIO, MinIO Console, Redis 7.2
├── .env.example
├── PROJECT_SPEC.md                 # Master Architecture & UI Specification
│
├── backend/                        # === NESTJS API & BULLMQ WORKERS ===
│   ├── src/
│   │   ├── database/               # Drizzle Schema (16 bảng) & Migrations
│   │   ├── modules/
│   │   │   ├── auth/               # Access/Refresh token, Google OAuth, OTP
│   │   │   ├── storage/            # MinIO Presigned URL & Sharp WebP
│   │   │   ├── products/           # Variants, Search, Smart Fit Finder
│   │   │   ├── stores/             # Cửa hàng vật lý & Tồn kho tại quầy
│   │   │   ├── lookbooks/          # Lookbook Hotspot Tagging (Shop The Look)
│   │   │   ├── leads/              # Tiếp nhận SĐT "Join the Movement"
│   │   │   ├── cart/               # Giỏ hàng
│   │   │   ├── orders/             # Atomic Stock Decrement & Checkout
│   │   │   ├── payments/           # PayOS / VNPay Webhooks (Idempotent)
│   │   │   └── queues/             # BullMQ Workers (Stock Auto-Release 15p, Mailer)
│   │   └── common/
│   ├── drizzle.config.ts
│   └── package.json
│
└── frontend/                       # === NEXT.JS 15 STOREFRONT & ADMIN ===
    ├── src/
    │   ├── app/
    │   │   ├── (store)/            # STOREFRONT STREETWEAR
    │   │   │   ├── layout.tsx      # HeaderMegaMenu, MiniCartDrawer, PhoneSubscribeBanner, Footer
    │   │   │   ├── page.tsx        # Hero Lookbook, HomeCollectionTabs, Bento Discovery
    │   │   │   ├── shop/           # Listing với FacetedFilterDrawer (Size, Color, Price)
    │   │   │   ├── products/[slug]/# PDP 2 cột, Color swatches, StoreInventoryDrawer, FitFinder
    │   │   │   ├── lookbooks/      # Trang Shop The Look Hotspots
    │   │   │   ├── checkout/       # Checkout 1 bước + QR PayOS đếm ngược 15p
    │   │   │   └── account/
    │   │   ├── (admin)/            # ADMIN CMS
    │   │   │   ├── admin/products/ # Ma trận biến thể (Size x Màu) + Upload MinIO
    │   │   │   ├── admin/lookbooks/# Chấm tọa độ Hotspot (x%, y%) trên ảnh mẫu
    │   │   │   └── admin/orders/
    │   │   └── api/
    │   ├── components/
    │   │   ├── store/              # ProductCard, HeaderMegaMenu, MiniCartDrawer,
    │   │   │                       # FacetedFilterDrawer, StoreInventoryDrawer, FitFinderModal,
    │   │   │                       # PhoneSubscribeBanner, QuickViewModal
    │   │   ├── admin/
    │   │   └── ui/                 # shadcn/ui (rounded-none, border-neutral-200)
    │   ├── stores/                 # Zustand (cart-store.ts, wishlist-store.ts)
    │   └── tailwind.config.ts      # Streetwear Design Tokens
    └── package.json
```

---

## 7. LỘ TRÌNH TRIỂN KHAI THỰC CHIẾN

1. **Bước 1 (Hạ Tầng):** Chạy `docker-compose.yml` (PostgreSQL 16, MinIO, Redis 7.2).
2. **Bước 2 (Backend Base):** Cài đặt NestJS, Drizzle ORM, cấu hình BigInt cho tiền tệ VNĐ và BullMQ.
3. **Bước 3 (CSDL Toàn Diện):** Đẩy Schema Drizzle v3.0 vào PostgreSQL với đầy đủ 16 bảng quan hệ.
4. **Bước 4 (Storage Module):** MinIO Presigned PUT URL Generator + Sharp WebP.
5. **Bước 5 (Backend APIs):** Hoàn thiện API Catalog (Quick Size Bar, Faceted Search), Fit Finder, Tồn kho chi nhánh, Lead SĐT, Đơn hàng và Thanh toán QR giữ kho 15p.
6. **Bước 6 (Frontend Base):** Khởi tạo Next.js 15, cấu hình Tailwind Tokens chuẩn DirtyCoins, cài đặt `shadcn/ui` tinh chỉnh `rounded-none`.
7. **Bước 7 (Giao Diện Storefront):** Xây dựng `HeaderMegaMenu`, `ProductCard`, `InstantSearchDrawer`, `MiniCartDrawer`, trang PDP 2 cột và `PhoneSubscribeBanner`.
8. **Bước 8 (Admin & Lookbook Hotspots):** Xây dựng giao diện quản trị và công cụ chấm điểm Hotspot "Shop The Look".
