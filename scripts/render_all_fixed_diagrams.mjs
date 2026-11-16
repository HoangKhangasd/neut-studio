import fs from 'node:fs';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'c:/Project/Neut-Studio/docs/images';

const diagrams = [
  {
    name: '01_master_erd.png',
    width: 3200,
    height: 1800,
    code: `erDiagram
    USERS ||--o{ USER_ADDRESSES : "user_id -> users.id"
    USERS ||--o{ WISHLISTS : "user_id -> users.id"
    PRODUCTS ||--o{ WISHLISTS : "product_id -> products.id"

    CATEGORIES ||--o{ PRODUCTS : "category_id -> categories.id"
    COLLECTIONS ||--o{ COLLECTION_PRODUCTS : "collection_id -> collections.id"

    PRODUCTS ||--o{ COLLECTION_PRODUCTS : "product_id -> products.id"
    PRODUCTS ||--o{ PRODUCT_VARIANTS : "product_id -> products.id"
    PRODUCTS ||--o{ PRODUCT_IMAGES : "product_id -> products.id"
    PRODUCTS ||--o{ PRODUCT_REVIEWS : "product_id -> products.id"
    USERS ||--o{ PRODUCT_REVIEWS : "user_id -> users.id"

    LOOKBOOKS ||--o{ LOOKBOOK_HOTSPOTS : "lookbook_id -> lookbooks.id"
    PRODUCTS ||--o{ LOOKBOOK_HOTSPOTS : "product_id -> products.id"

    USERS ||--o{ CARTS : "user_id -> users.id"
    CARTS ||--o{ CART_ITEMS : "cart_id -> carts.id"
    PRODUCT_VARIANTS ||--o{ CART_ITEMS : "variant_id -> product_variants.id"

    USERS ||--o{ ORDERS : "user_id -> users.id"
    ORDERS ||--o{ ORDER_ITEMS : "order_id -> orders.id"
    PRODUCT_VARIANTS ||--o{ ORDER_ITEMS : "variant_id -> product_variants.id"

    ORDERS ||--o{ PAYMENT_TRANSACTIONS : "order_id -> orders.id"

    COUPONS ||--o{ COUPON_USAGES : "coupon_id -> coupons.id"
    USERS ||--o{ COUPON_USAGES : "user_id -> users.id"
    ORDERS ||--o{ COUPON_USAGES : "order_id -> orders.id"

    STORES ||--o{ STORE_INVENTORIES : "store_id -> stores.id"
    PRODUCT_VARIANTS ||--o{ STORE_INVENTORIES : "variant_id -> product_variants.id"

    USERS {
        uuid id PK
        varchar email UK
        varchar full_name
        varchar role
    }
    USER_ADDRESSES {
        uuid id PK
        uuid user_id FK "users.id"
        varchar recipient_name
        text street_address
    }
    WISHLISTS {
        uuid id PK
        uuid user_id FK "users.id"
        uuid product_id FK "products.id"
    }
    CATEGORIES {
        uuid id PK
        varchar name
        varchar slug UK
        uuid parent_id FK "categories.id (cha)"
    }
    COLLECTIONS {
        uuid id PK
        varchar name
        varchar slug UK
        boolean is_collab
    }
    COLLECTION_PRODUCTS {
        uuid id PK
        uuid collection_id FK "collections.id"
        uuid product_id FK "products.id"
    }
    PRODUCTS {
        uuid id PK
        varchar title
        varchar slug UK
        uuid category_id FK "categories.id"
        boolean is_published
    }
    PRODUCT_VARIANTS {
        uuid id PK
        uuid product_id FK "products.id"
        varchar sku UK
        varchar color_name
        varchar size
        bigint price
        integer stock_quantity
    }
    PRODUCT_IMAGES {
        uuid id PK
        uuid product_id FK "products.id"
        varchar image_url
        varchar color_attached
        boolean is_cover
    }
    LOOKBOOKS {
        uuid id PK
        varchar title
        varchar image_url
    }
    LOOKBOOK_HOTSPOTS {
        uuid id PK
        uuid lookbook_id FK "lookbooks.id"
        uuid product_id FK "products.id"
        integer x_percent
        integer y_percent
    }
    PRODUCT_REVIEWS {
        uuid id PK
        uuid product_id FK "products.id"
        uuid user_id FK "users.id"
        integer rating
        integer fit_score
        varchar purchased_size
    }
    CARTS {
        uuid id PK
        uuid user_id FK "users.id"
        varchar session_id
    }
    CART_ITEMS {
        uuid id PK
        uuid cart_id FK "carts.id"
        uuid variant_id FK "product_variants.id"
        integer quantity
    }
    ORDERS {
        uuid id PK
        varchar order_code UK
        uuid user_id FK "users.id"
        bigint total_amount
        varchar payment_method
        varchar order_status
    }
    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK "orders.id"
        uuid variant_id FK "product_variants.id"
        varchar product_title
        varchar variant_sku
        bigint unit_price
        integer quantity
    }
    PAYMENT_TRANSACTIONS {
        uuid id PK
        uuid order_id FK "orders.id"
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
        uuid coupon_id FK "coupons.id"
        uuid user_id FK "users.id"
        uuid order_id FK "orders.id"
    }
    STORES {
        uuid id PK
        varchar name
        varchar address
        varchar city
    }
    STORE_INVENTORIES {
        uuid id PK
        uuid store_id FK "stores.id"
        uuid variant_id FK "product_variants.id"
        integer stock_quantity
    }
    NEWSLETTER_LEADS {
        uuid id PK
        varchar phone UK
        varchar discount_code_sent
        boolean is_used
    }`
  },
  {
    name: '02_auth_users.png',
    width: 1400,
    height: 900,
    code: `erDiagram
    USERS ||--o{ USER_ADDRESSES : "user_id -> users.id"
    USERS ||--o{ WISHLISTS : "user_id -> users.id"
    PRODUCTS ||--o{ WISHLISTS : "product_id -> products.id"

    USERS {
        uuid id PK
        varchar email UK
        varchar password_hash
        varchar full_name
        varchar phone
        varchar role
        varchar avatar_url
    }
    USER_ADDRESSES {
        uuid id PK
        uuid user_id FK "users.id"
        varchar recipient_name
        varchar phone_number
        varchar province
        varchar district
        varchar ward
        text street_address
        boolean is_default
    }
    WISHLISTS {
        uuid id PK
        uuid user_id FK "users.id"
        uuid product_id FK "products.id"
    }
    PRODUCTS {
        uuid id PK
        varchar title
        varchar slug UK
    }`
  },
  {
    name: '03_catalog_products.png',
    width: 1800,
    height: 1200,
    code: `erDiagram
    CATEGORIES ||--o{ PRODUCTS : "category_id -> categories.id"
    COLLECTIONS ||--o{ COLLECTION_PRODUCTS : "collection_id -> collections.id"
    PRODUCTS ||--o{ COLLECTION_PRODUCTS : "product_id -> products.id"
    PRODUCTS ||--o{ PRODUCT_VARIANTS : "product_id -> products.id"
    PRODUCTS ||--o{ PRODUCT_IMAGES : "product_id -> products.id"

    CATEGORIES {
        uuid id PK
        varchar name
        varchar slug UK
        uuid parent_id FK "categories.id (cấp cha)"
        integer sort_order
        boolean is_active
    }
    COLLECTIONS {
        uuid id PK
        varchar name
        varchar slug UK
        boolean is_collab
        boolean is_active
    }
    COLLECTION_PRODUCTS {
        uuid id PK
        uuid collection_id FK "collections.id"
        uuid product_id FK "products.id"
    }
    PRODUCTS {
        uuid id PK
        varchar title
        varchar slug UK
        uuid category_id FK "categories.id"
        boolean is_published
        boolean is_featured
    }
    PRODUCT_VARIANTS {
        uuid id PK
        uuid product_id FK "products.id"
        varchar sku UK
        varchar color_name
        varchar color_hex
        varchar size
        bigint price
        bigint sale_price
        integer stock_quantity
    }
    PRODUCT_IMAGES {
        uuid id PK
        uuid product_id FK "products.id"
        varchar image_url
        varchar color_attached
        boolean is_cover
        integer sort_order
    }`
  },
  {
    name: '04_lookbook_reviews.png',
    width: 1600,
    height: 1000,
    code: `erDiagram
    LOOKBOOKS ||--o{ LOOKBOOK_HOTSPOTS : "lookbook_id -> lookbooks.id"
    PRODUCTS ||--o{ LOOKBOOK_HOTSPOTS : "product_id -> products.id"
    PRODUCTS ||--o{ PRODUCT_REVIEWS : "product_id -> products.id"
    USERS ||--o{ PRODUCT_REVIEWS : "user_id -> users.id"

    LOOKBOOKS {
        uuid id PK
        varchar title
        varchar image_url
        boolean is_active
    }
    LOOKBOOK_HOTSPOTS {
        uuid id PK
        uuid lookbook_id FK "lookbooks.id"
        uuid product_id FK "products.id"
        integer x_percent
        integer y_percent
    }
    PRODUCT_REVIEWS {
        uuid id PK
        uuid product_id FK "products.id"
        uuid user_id FK "users.id"
        integer rating
        integer fit_score
        integer user_height_cm
        integer user_weight_kg
        text comment
    }
    PRODUCTS {
        uuid id PK
        varchar title
    }
    USERS {
        uuid id PK
        varchar full_name
    }`
  },
  {
    name: '05_cart_orders.png',
    width: 1800,
    height: 1100,
    code: `erDiagram
    USERS ||--o{ CARTS : "user_id -> users.id"
    CARTS ||--o{ CART_ITEMS : "cart_id -> carts.id"
    PRODUCT_VARIANTS ||--o{ CART_ITEMS : "variant_id -> product_variants.id"
    USERS ||--o{ ORDERS : "user_id -> users.id"
    ORDERS ||--o{ ORDER_ITEMS : "order_id -> orders.id"
    PRODUCT_VARIANTS ||--o{ ORDER_ITEMS : "variant_id -> product_variants.id"

    CARTS {
        uuid id PK
        uuid user_id FK "users.id"
        varchar session_id
    }
    CART_ITEMS {
        uuid id PK
        uuid cart_id FK "carts.id"
        uuid variant_id FK "product_variants.id"
        integer quantity
    }
    ORDERS {
        uuid id PK
        varchar order_code UK
        uuid user_id FK "users.id"
        bigint total_amount
        varchar payment_method
        varchar payment_status
        varchar order_status
        timestamp expires_at
    }
    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK "orders.id"
        uuid variant_id FK "product_variants.id"
        varchar product_title
        varchar variant_sku
        bigint unit_price
        integer quantity
    }
    USERS {
        uuid id PK
        varchar email
    }
    PRODUCT_VARIANTS {
        uuid id PK
        varchar sku
        bigint price
    }`
  },
  {
    name: '06_payments_coupons.png',
    width: 1600,
    height: 1000,
    code: `erDiagram
    ORDERS ||--o{ PAYMENT_TRANSACTIONS : "order_id -> orders.id"
    COUPONS ||--o{ COUPON_USAGES : "coupon_id -> coupons.id"
    USERS ||--o{ COUPON_USAGES : "user_id -> users.id"
    ORDERS ||--o{ COUPON_USAGES : "order_id -> orders.id"

    PAYMENT_TRANSACTIONS {
        uuid id PK
        uuid order_id FK "orders.id"
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
        uuid coupon_id FK "coupons.id"
        uuid user_id FK "users.id"
        uuid order_id FK "orders.id"
    }
    ORDERS {
        uuid id PK
        varchar order_code
    }
    USERS {
        uuid id PK
        varchar full_name
    }
    NEWSLETTER_LEADS {
        uuid id PK
        varchar phone UK
        varchar discount_code_sent
    }`
  },
  {
    name: '07_stores_inventory.png',
    width: 1400,
    height: 700,
    code: `erDiagram
    STORES ||--o{ STORE_INVENTORIES : "store_id -> stores.id"
    PRODUCT_VARIANTS ||--o{ STORE_INVENTORIES : "variant_id -> product_variants.id"

    STORES {
        uuid id PK
        varchar name
        varchar address
        varchar city
        varchar phone
    }
    STORE_INVENTORIES {
        uuid id PK
        uuid store_id FK "stores.id"
        uuid variant_id FK "product_variants.id"
        integer stock_quantity
    }
    PRODUCT_VARIANTS {
        uuid id PK
        varchar sku
        varchar size
    }`
  }
];

function createHtml(mermaidCode) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #ffffff;
      padding: 30px;
      display: inline-block;
      font-family: Arial, sans-serif;
    }
    svg {
      max-width: none !important;
      height: auto !important;
      display: block;
    }
  </style>
</head>
<body>
  <div class="mermaid">
${mermaidCode}
  </div>
  <script>
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      er: {
        useMaxWidth: false,
        fontSize: 14
      }
    });
  </script>
</body>
</html>`;
}

async function renderAll() {
  const tempHtmlPath = path.join(outDir, 'temp_render.html');

  for (const d of diagrams) {
    console.log(`Rendering ${d.name}...`);
    const html = createHtml(d.code);
    fs.writeFileSync(tempHtmlPath, html, 'utf8');

    const outPng = path.join(outDir, d.name);
    const args = [
      '--headless',
      '--disable-gpu',
      '--virtual-time-budget=2000',
      '--force-device-scale-factor=2',
      `--window-size=${d.width},${d.height}`,
      `--screenshot=${outPng}`,
      `file:///${tempHtmlPath.replace(/\\/g, '/')}`
    ];

    try {
      await execFileAsync(chromePath, args);
      const stat = fs.statSync(outPng);
      console.log(`Saved ${d.name} (${stat.size} bytes)`);
    } catch (e) {
      console.error(`Error rendering ${d.name}:`, e.message);
    }
  }

  try { fs.unlinkSync(tempHtmlPath); } catch {}
  console.log('ALL DIAGRAMS RENDERED CRISP & CLEAN!');
}

renderAll();
