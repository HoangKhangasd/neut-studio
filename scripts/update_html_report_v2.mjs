import fs from 'node:fs';

const masterCode = `erDiagram
    USERS ||--o{ USER_ADDRESSES : "user_id -> id"
    USERS ||--o{ WISHLISTS : "user_id -> id"
    PRODUCTS ||--o{ WISHLISTS : "product_id -> id"

    CATEGORIES ||--o{ CATEGORIES : "parent_id -> id"
    CATEGORIES ||--o{ PRODUCTS : "category_id -> id"

    COLLECTIONS ||--o{ COLLECTION_PRODUCTS : "collection_id -> id"
    PRODUCTS ||--o{ COLLECTION_PRODUCTS : "product_id -> id"

    PRODUCTS ||--o{ PRODUCT_VARIANTS : "product_id -> id"
    PRODUCTS ||--o{ PRODUCT_IMAGES : "product_id -> id"
    PRODUCTS ||--o{ PRODUCT_REVIEWS : "product_id -> id"
    USERS ||--o{ PRODUCT_REVIEWS : "user_id -> id"

    LOOKBOOKS ||--o{ LOOKBOOK_HOTSPOTS : "lookbook_id -> id"
    PRODUCTS ||--o{ LOOKBOOK_HOTSPOTS : "product_id -> id"

    USERS ||--o{ CARTS : "user_id -> id"
    CARTS ||--o{ CART_ITEMS : "cart_id -> id"
    PRODUCT_VARIANTS ||--o{ CART_ITEMS : "variant_id -> id"

    USERS ||--o{ ORDERS : "user_id -> id"
    ORDERS ||--o{ ORDER_ITEMS : "order_id -> id"
    PRODUCT_VARIANTS ||--o{ ORDER_ITEMS : "variant_id -> id"

    ORDERS ||--o{ PAYMENT_TRANSACTIONS : "order_id -> id"

    COUPONS ||--o{ COUPON_USAGES : "coupon_id -> id"
    USERS ||--o{ COUPON_USAGES : "user_id -> id"
    ORDERS ||--o{ COUPON_USAGES : "order_id -> id"

    STORES ||--o{ STORE_INVENTORIES : "store_id -> id"
    PRODUCT_VARIANTS ||--o{ STORE_INVENTORIES : "variant_id -> id"

    USERS {
        uuid id PK
        varchar email UK
        varchar full_name
        varchar role
    }
    USER_ADDRESSES {
        uuid id PK
        uuid user_id FK
        varchar recipient_name
        varchar phone_number
        varchar province
        text street_address
    }
    WISHLISTS {
        uuid id PK
        uuid user_id FK
        uuid product_id FK
    }
    CATEGORIES {
        uuid id PK
        varchar name
        varchar slug UK
        uuid parent_id FK
    }
    COLLECTIONS {
        uuid id PK
        varchar name
        varchar slug UK
        boolean is_collab
    }
    COLLECTION_PRODUCTS {
        uuid id PK
        uuid collection_id FK
        uuid product_id FK
    }
    PRODUCTS {
        uuid id PK
        varchar title
        varchar slug UK
        uuid category_id FK
        boolean is_published
    }
    PRODUCT_VARIANTS {
        uuid id PK
        uuid product_id FK
        varchar sku UK
        varchar color_name
        varchar size
        bigint price
        integer stock_quantity
    }
    PRODUCT_IMAGES {
        uuid id PK
        uuid product_id FK
        varchar image_url
        varchar color_attached
        boolean is_cover
    }
    PRODUCT_REVIEWS {
        uuid id PK
        uuid product_id FK
        uuid user_id FK
        integer rating
        integer fit_score
        varchar purchased_size
    }
    LOOKBOOKS {
        uuid id PK
        varchar title
        varchar image_url
    }
    LOOKBOOK_HOTSPOTS {
        uuid id PK
        uuid lookbook_id FK
        uuid product_id FK
        integer x_percent
        integer y_percent
    }
    CARTS {
        uuid id PK
        uuid user_id FK
        varchar session_id
    }
    CART_ITEMS {
        uuid id PK
        uuid cart_id FK
        uuid variant_id FK
        integer quantity
    }
    ORDERS {
        uuid id PK
        varchar order_code UK
        uuid user_id FK
        bigint total_amount
        varchar payment_method
        varchar order_status
    }
    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        uuid variant_id FK
        varchar product_title
        varchar variant_sku
        bigint unit_price
        integer quantity
    }
    PAYMENT_TRANSACTIONS {
        uuid id PK
        uuid order_id FK
        varchar provider
        varchar provider_transaction_id UK
        bigint amount
        varchar status
    }
    COUPONS {
        uuid id PK
        varchar code UK
        varchar discount_type
        integer discount_value
        integer usage_limit
        integer used_count
    }
    COUPON_USAGES {
        uuid id PK
        uuid coupon_id FK
        uuid user_id FK
        uuid order_id FK
    }
    STORES {
        uuid id PK
        varchar name
        varchar address
        varchar city
    }
    STORE_INVENTORIES {
        uuid id PK
        uuid store_id FK
        uuid variant_id FK
        integer stock_quantity
    }
    NEWSLETTER_LEADS {
        uuid id PK
        varchar phone UK
        varchar discount_code_sent
        boolean is_used
    }`;

const diagrams = [
  {
    title: '1. Sơ Đồ ERD Toàn Diện (Master ERD - Chi Tiết & Rõ Các Trường Liên Kết)',
    code: masterCode
  },
  {
    title: '2.1. Phân hệ Người dùng & Quản lý Tài khoản (Authentication & Identity)',
    code: `erDiagram
    users ||--o{ user_addresses : "owns"
    users ||--o{ wishlists : "bookmarks"
    products ||--o{ wishlists : "saved_in"

    users {
        uuid id PK
        varchar email UK
        varchar password_hash
        varchar full_name
        varchar phone
        varchar role
        varchar avatar_url
    }
    user_addresses {
        uuid id PK
        uuid user_id FK
        varchar recipient_name
        varchar phone_number
        varchar province
        varchar district
        varchar ward
        text street_address
        boolean is_default
    }
    wishlists {
        uuid id PK
        uuid user_id FK
        uuid product_id FK
    }`
  },
  {
    title: '2.2. Phân hệ Danh mục, Bộ sưu tập & Sản phẩm (Catalog & Products)',
    code: `erDiagram
    categories ||--o{ categories : "parent_of"
    categories ||--o{ products : "classifies"
    collections ||--o{ collection_products : "contains"
    products ||--o{ collection_products : "belongs_to"
    products ||--o{ product_variants : "has_variants"
    products ||--o{ product_images : "has_gallery"

    categories {
        uuid id PK
        varchar name
        varchar slug UK
        uuid parent_id FK
    }
    collections {
        uuid id PK
        varchar name
        varchar slug UK
        boolean is_collab
    }
    products {
        uuid id PK
        varchar title
        varchar slug UK
        uuid category_id FK
        boolean is_published
        boolean is_featured
    }
    product_variants {
        uuid id PK
        uuid product_id FK
        varchar sku UK
        varchar color_name
        varchar color_hex
        varchar size
        bigint price
        bigint sale_price
        integer stock_quantity
    }
    product_images {
        uuid id PK
        uuid product_id FK
        varchar image_url
        varchar color_attached
        boolean is_cover
    }`
  },
  {
    title: '2.3. Phân hệ Trải nghiệm Mua sắm (Lookbook Hotspot & Reviews)',
    code: `erDiagram
    lookbooks ||--o{ lookbook_hotspots : "features"
    products ||--o{ lookbook_hotspots : "pinned_in"
    products ||--o{ product_reviews : "evaluated_by"
    users ||--o{ product_reviews : "writes"

    lookbooks {
        uuid id PK
        varchar title
        varchar image_url
    }
    lookbook_hotspots {
        uuid id PK
        uuid lookbook_id FK
        uuid product_id FK
        integer x_percent
        integer y_percent
    }
    product_reviews {
        uuid id PK
        uuid product_id FK
        uuid user_id FK
        integer rating
        integer fit_score
        integer user_height_cm
        integer user_weight_kg
        text comment
    }`
  },
  {
    title: '2.4. Phân hệ Giỏ hàng & Quản lý Đơn hàng (Cart, Orders & Fulfillment)',
    code: `erDiagram
    users ||--o{ carts : "owns"
    carts ||--o{ cart_items : "contains"
    product_variants ||--o{ cart_items : "added_as"
    users ||--o{ orders : "places"
    orders ||--o{ order_items : "includes"
    product_variants |o--o{ order_items : "referenced_in"

    carts {
        uuid id PK
        uuid user_id FK
        varchar session_id
    }
    cart_items {
        uuid id PK
        uuid cart_id FK
        uuid variant_id FK
        integer quantity
    }
    orders {
        uuid id PK
        varchar order_code UK
        uuid user_id FK
        bigint total_amount
        varchar payment_method
        varchar payment_status
        varchar order_status
        timestamp expires_at
    }
    order_items {
        uuid id PK
        uuid order_id FK
        uuid variant_id FK
        varchar product_title
        varchar variant_sku
        bigint unit_price
        integer quantity
    }`
  },
  {
    title: '2.5. Phân hệ Thanh toán & Khuyến mãi (Payments & Marketing)',
    code: `erDiagram
    orders ||--o{ payment_transactions : "paid_via"
    coupons ||--o{ coupon_usages : "tracked_in"
    users ||--o{ coupon_usages : "redeems"
    orders ||--o{ coupon_usages : "applied_in"

    payment_transactions {
        uuid id PK
        uuid order_id FK
        varchar provider
        varchar provider_transaction_id UK
        bigint amount
        varchar status
    }
    coupons {
        uuid id PK
        varchar code UK
        varchar discount_type
        integer discount_value
        integer usage_limit
        integer used_count
    }
    coupon_usages {
        uuid id PK
        uuid coupon_id FK
        uuid user_id FK
        uuid order_id FK
    }
    newsletter_leads {
        uuid id PK
        varchar phone UK
        varchar discount_code_sent
    }`
  },
  {
    title: '2.6. Phân hệ Chuỗi Cửa Hàng & Tồn Kho Chi Nhánh (Stores & O2O)',
    code: `erDiagram
    stores ||--o{ store_inventories : "stocks"
    product_variants ||--o{ store_inventories : "stocked_at"

    stores {
        uuid id PK
        varchar name
        varchar address
        varchar city
        varchar phone
    }
    store_inventories {
        uuid id PK
        uuid store_id FK
        uuid variant_id FK
        integer stock_quantity
    }`
  }
];

let html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Sơ Đồ Thực Thể Quan Hệ (ERD) - Neut-Studio E-Commerce</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #111; max-width: 900px; margin: 0 auto; padding: 20px; }
    h1 { font-size: 24px; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 8px; }
    h2 { font-size: 18px; margin-top: 28px; border-left: 4px solid #000; padding-left: 10px; }
    h3 { font-size: 15px; margin-top: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
    th, td { border: 1px solid #ccc; padding: 8px 10px; text-align: left; }
    th { background: #f0f0f0; }
    .img-container { text-align: center; margin: 15px 0; }
    img { max-width: 100%; height: auto; border: 1px solid #e0e0e0; border-radius: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.05); }
    .meta { color: #666; font-size: 13px; margin-bottom: 24px; }
  </style>
</head>
<body>
  <h1>Sơ Đồ Thực Thể Quan Hệ (ERD) Hệ Thống Neut-Studio</h1>
  <div class="meta">
    <p><strong>Dự án:</strong> Neut-Studio Streetwear E-Commerce Monorepo<br/>
    <strong>Hệ quản trị CSDL:</strong> PostgreSQL 16 | <strong>ORM:</strong> Drizzle ORM | <strong>Quy mô:</strong> 22 Bảng | <strong>Định danh:</strong> UUID v4</p>
  </div>
`;

for (const d of diagrams) {
  const b64 = Buffer.from(d.code.trim()).toString('base64');
  const publicUrl = 'https://mermaid.ink/img/' + b64;
  html += `
  <h2>${d.title}</h2>
  <div class="img-container">
    <img src="${publicUrl}" alt="${d.title}" />
  </div>
`;
}

html += `
  <h2>3. Quy Tắc Ràng Buộc Khóa Ngoại (Foreign Key Cascade Rules)</h2>
  <table>
    <thead>
      <tr>
        <th>Bảng Nguồn (Child Table)</th>
        <th>Cột Khóa Ngoại</th>
        <th>Bảng Đích (Parent Table)</th>
        <th>Hành vi ON DELETE</th>
        <th>Mục đích Nghiệp vụ</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>user_addresses</code></td>
        <td><code>user_id</code></td>
        <td><code>users(id)</code></td>
        <td><strong>CASCADE</strong></td>
        <td>Xóa tài khoản tự động dọn dẹp sổ địa chỉ</td>
      </tr>
      <tr>
        <td><code>categories</code></td>
        <td><code>parent_id</code></td>
        <td><code>categories(id)</code></td>
        <td><strong>SET NULL</strong></td>
        <td>Xóa danh mục cha thì danh mục con chuyển lên cấp gốc</td>
      </tr>
      <tr>
        <td><code>products</code></td>
        <td><code>category_id</code></td>
        <td><code>categories(id)</code></td>
        <td><strong>SET NULL</strong></td>
        <td>Xóa danh mục không làm mất dữ liệu sản phẩm</td>
      </tr>
      <tr>
        <td><code>product_variants</code></td>
        <td><code>product_id</code></td>
        <td><code>products(id)</code></td>
        <td><strong>CASCADE</strong></td>
        <td>Xóa sản phẩm tự động xóa toàn bộ SKU phân loại</td>
      </tr>
      <tr>
        <td><code>product_reviews</code></td>
        <td><code>user_id</code></td>
        <td><code>users(id)</code></td>
        <td><strong>SET NULL</strong></td>
        <td>Người dùng xóa tài khoản thì đánh giá vẫn được giữ lại làm Social Proof</td>
      </tr>
      <tr>
        <td><code>orders</code></td>
        <td><code>user_id</code></td>
        <td><code>users(id)</code></td>
        <td><strong>SET NULL</strong></td>
        <td>Bảo toàn dữ liệu hóa đơn và doanh thu khi tài khoản khách bị xóa</td>
      </tr>
      <tr>
        <td><code>order_items</code></td>
        <td><code>variant_id</code></td>
        <td><code>product_variants(id)</code></td>
        <td><strong>SET NULL</strong></td>
        <td>SKU sản phẩm bị thay đổi/xóa không làm mất dấu vết hóa đơn kế toán</td>
      </tr>
      <tr>
        <td><code>payment_transactions</code></td>
        <td><code>order_id</code></td>
        <td><code>orders(id)</code></td>
        <td><strong>RESTRICT</strong></td>
        <td>Nghiêm cấm xóa đơn hàng đã có bản ghi giao dịch ngân hàng/cổng thanh toán</td>
      </tr>
    </tbody>
  </table>
</body>
</html>
`;

fs.writeFileSync('c:/Project/Neut-Studio/docs/ERD_Report.html', html, 'utf8');
console.log('Successfully updated docs/ERD_Report.html with new master ERD cloud image!');
