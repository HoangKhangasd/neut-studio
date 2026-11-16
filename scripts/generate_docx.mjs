import fs from 'node:fs';
import path from 'node:path';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  PageOrientation
} from 'docx';

const imagesDir = 'c:/Project/Neut-Studio/docs/images';

function loadImage(filename) {
  const filePath = path.join(imagesDir, filename);
  return fs.readFileSync(filePath);
}

const doc = new Document({
  title: 'Sơ Đồ Thực Thể Quan Hệ (ERD) - Hệ Thống Neut-Studio',
  description: 'Tài liệu kiến trúc cơ sở dữ liệu và sơ đồ ERD hệ thống Neut-Studio Streetwear Monorepo',
  sections: [
    // SECTION 1: MASTER ERD (LANDSCAPE FOR MAXIMUM SHARPNESS & DETAIL)
    {
      properties: {
        page: {
          orientation: PageOrientation.LANDSCAPE,
          margin: { top: 720, right: 720, bottom: 720, left: 720 }
        }
      },
      children: [
        new Paragraph({
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 150 },
          children: [
            new TextRun({
              text: 'SƠ ĐỒ THỰC THỂ QUAN HỆ (ERD) TOÀN DIỆN',
              bold: true,
              size: 32,
              color: '111111'
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 250 },
          children: [
            new TextRun({
              text: 'NEUT-STUDIO STREETWEAR E-COMMERCE (POSTGRESQL 16 + DRIZZLE ORM)',
              bold: true,
              size: 20,
              color: '555555'
            })
          ]
        }),
        new Paragraph({
          spacing: { after: 150 },
          children: [
            new TextRun({
              text: 'Sơ đồ dưới đây hiển thị rõ ràng toàn bộ 22 bảng thực thể, các trường khóa chính (PK), khóa ngoại (FK), và các trường liên kết cụ thể giữa các bảng (ví dụ: user_id -> id, product_id -> id, order_id -> id...):',
              italics: true,
              size: 18
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [
            new ImageRun({
              data: loadImage('01_master_erd.png'),
              transformation: { width: 950, height: 295 },
              type: 'png'
            })
          ]
        })
      ]
    },

    // SECTION 2: DETAILED MODULES (PORTRAIT)
    {
      properties: {
        page: {
          orientation: PageOrientation.PORTRAIT,
          margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 }
        }
      },
      children: [
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 150 },
          children: [
            new TextRun({ text: '2. Phân Tích Chi Tiết Các Trường Liên Kết (Foreign Keys Mapping)', bold: true, size: 26 })
          ]
        }),
        new Paragraph({
          spacing: { after: 150 },
          children: [
            new TextRun('Dưới đây là danh sách phân rã chi tiết từng mối quan hệ liên kết dữ liệu giữa các phân hệ:')
          ]
        }),

        // 2.1 Auth
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
          children: [
            new TextRun({ text: '2.1. Phân hệ Người Dùng & Sổ Địa Chỉ (Auth & Users)', bold: true, size: 22 })
          ]
        }),
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({ text: '• user_addresses.user_id ➔ users.id: ', bold: true }),
            new TextRun('Liên kết sổ địa chỉ giao hàng với tài khoản người dùng (ON DELETE CASCADE).')
          ]
        }),
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({ text: '• wishlists.user_id ➔ users.id & wishlists.product_id ➔ products.id: ', bold: true }),
            new TextRun('Lưu danh sách sản phẩm yêu thích của khách hàng.')
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [
            new ImageRun({
              data: loadImage('02_auth_users.png'),
              transformation: { width: 550, height: 360 },
              type: 'png'
            })
          ]
        }),

        // 2.2 Catalog
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
          children: [
            new TextRun({ text: '2.2. Phân hệ Danh Mục, Bộ Sưu Tập & Biến Thể Sản Phẩm (Catalog & Products)', bold: true, size: 22 })
          ]
        }),
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({ text: '• categories.parent_id ➔ categories.id: ', bold: true }),
            new TextRun('Cấu trúc cây danh mục cha - con (Tops -> T-Shirts, Hoodies).')
          ]
        }),
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({ text: '• products.category_id ➔ categories.id: ', bold: true }),
            new TextRun('Phân loại danh mục chính của sản phẩm.')
          ]
        }),
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({ text: '• product_variants.product_id ➔ products.id: ', bold: true }),
            new TextRun('Một sản phẩm có nhiều phân loại SKU kích cỡ (S/M/L/XL), màu sắc và tồn kho.')
          ]
        }),
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({ text: '• product_images.product_id ➔ products.id: ', bold: true }),
            new TextRun('Bộ sưu tập ảnh S3/MinIO liên kết với sản phẩm và màu sắc.')
          ]
        }),
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({ text: '• collection_products.collection_id ➔ collections.id & product_id ➔ products.id: ', bold: true }),
            new TextRun('Quan hệ nhiều-nhiều đưa sản phẩm vào các chiến dịch Collab giới hạn.')
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [
            new ImageRun({
              data: loadImage('03_catalog_products.png'),
              transformation: { width: 580, height: 420 },
              type: 'png'
            })
          ]
        }),

        // 2.3 Lookbook & Reviews
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
          children: [
            new TextRun({ text: '2.3. Phân hệ Lookbook Hotspot & Đánh Giá Form Dáng (Reviews & Fit)', bold: true, size: 22 })
          ]
        }),
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({ text: '• lookbook_hotspots.lookbook_id ➔ lookbooks.id & product_id ➔ products.id: ', bold: true }),
            new TextRun('Điểm ghim mua hàng trực tiếp với tọa độ (x_percent, y_percent) trên ảnh lookbook.')
          ]
        }),
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({ text: '• product_reviews.product_id ➔ products.id & user_id ➔ users.id: ', bold: true }),
            new TextRun('Đánh giá sản phẩm kèm thông số chiều cao, cân nặng, fit_score để phục vụ thuật toán Smart Fit Finder.')
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [
            new ImageRun({
              data: loadImage('04_lookbook_reviews.png'),
              transformation: { width: 550, height: 360 },
              type: 'png'
            })
          ]
        }),

        // 2.4 Cart & Orders
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
          children: [
            new TextRun({ text: '2.4. Phân hệ Giỏ Hàng & Quản Lý Đơn Hàng (Cart & Orders)', bold: true, size: 22 })
          ]
        }),
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({ text: '• carts.user_id ➔ users.id: ', bold: true }),
            new TextRun('Giỏ hàng gắn với tài khoản người dùng hoặc lưu session_id cho khách vãng lai.')
          ]
        }),
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({ text: '• cart_items.cart_id ➔ carts.id & variant_id ➔ product_variants.id: ', bold: true }),
            new TextRun('Chi tiết các dòng SKU được thêm vào giỏ.')
          ]
        }),
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({ text: '• orders.user_id ➔ users.id: ', bold: true }),
            new TextRun('Đơn hàng của khách hàng (hoặc null nếu khách mua không đăng nhập).')
          ]
        }),
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({ text: '• order_items.order_id ➔ orders.id & variant_id ➔ product_variants.id: ', bold: true }),
            new TextRun('Chi tiết từng món trong đơn, kèm snapshot tên, SKU, màu sắc, kích cỡ và đơn giá tại thời điểm chốt đơn.')
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [
            new ImageRun({
              data: loadImage('05_cart_orders.png'),
              transformation: { width: 580, height: 400 },
              type: 'png'
            })
          ]
        }),

        // 2.5 Payments & Marketing
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
          children: [
            new TextRun({ text: '2.5. Phân hệ Cổng Thanh Toán & Mã Giảm Giá (Payments & Coupons)', bold: true, size: 22 })
          ]
        }),
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({ text: '• payment_transactions.order_id ➔ orders.id: ', bold: true }),
            new TextRun('Bản ghi giao dịch thanh toán trực tuyến qua cổng PayOS/VNPay với mã provider_transaction_id duy nhất (Idempotent).')
          ]
        }),
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({ text: '• coupon_usages.coupon_id ➔ coupons.id, user_id ➔ users.id & order_id ➔ orders.id: ', bold: true }),
            new TextRun('Ghi nhận vết áp dụng mã voucher cho từng đơn hàng của người dùng.')
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [
            new ImageRun({
              data: loadImage('06_payments_coupons.png'),
              transformation: { width: 580, height: 380 },
              type: 'png'
            })
          ]
        }),

        // 2.6 Stores & Inventory
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
          children: [
            new TextRun({ text: '2.6. Phân hệ Cửa Hàng & Tồn Kho Chi Nhánh (Stores & O2O Inventory)', bold: true, size: 22 })
          ]
        }),
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({ text: '• store_inventories.store_id ➔ stores.id & variant_id ➔ product_variants.id: ', bold: true }),
            new TextRun('Quản lý tồn kho thực tế của từng SKU tại các chi nhánh showroom để hỗ trợ khách tra cứu tình trạng còn hàng.')
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [
            new ImageRun({
              data: loadImage('07_stores_inventory.png'),
              transformation: { width: 500, height: 260 },
              type: 'png'
            })
          ]
        }),

        // 3. TABLE SUMMARY
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 300, after: 150 },
          children: [
            new TextRun({ text: '3. Bảng Tổng Hợp Chi Tiết Tất Cả Các Trường Khóa Ngoại', bold: true, size: 26 })
          ]
        }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Bảng Con', bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Trường Khóa Ngoại', bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Tham Chiếu Đến', bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Quy Tắc Xóa', bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Mục Đích Nghiệp Vụ', bold: true })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: 'user_addresses' })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'user_id', bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ text: 'users.id' })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'CASCADE', bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ text: 'Xóa tài khoản tự động dọn dẹp sổ địa chỉ' })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: 'wishlists' })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'user_id', bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ text: 'users.id' })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'CASCADE', bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ text: 'Xóa tài khoản giải phóng danh sách yêu thích' })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: 'wishlists' })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'product_id', bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ text: 'products.id' })] }),
                new TableCell({ children: [new Paragraph({ text: 'RESTRICT/SET NULL' })] }),
                new TableCell({ children: [new Paragraph({ text: 'Liên kết tới sản phẩm được yêu thích' })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: 'categories' })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'parent_id', bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ text: 'categories.id' })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'SET NULL', bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ text: 'Xóa danh mục cha thì danh mục con chuyển lên cấp gốc' })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: 'products' })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'category_id', bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ text: 'categories.id' })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'SET NULL', bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ text: 'Xóa danh mục không làm mất dữ liệu sản phẩm' })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: 'product_variants' })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'product_id', bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ text: 'products.id' })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'CASCADE', bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ text: 'Xóa sản phẩm tự động xóa toàn bộ SKU phân loại' })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: 'product_images' })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'product_id', bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ text: 'products.id' })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'CASCADE', bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ text: 'Xóa sản phẩm xóa toàn bộ ảnh liên quan' })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: 'collection_products' })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'collection_id', bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ text: 'collections.id' })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'CASCADE', bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ text: 'Xóa bộ sưu tập dọn dẹp bảng liên kết N:N' })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: 'product_reviews' })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'product_id', bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ text: 'products.id' })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'CASCADE', bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ text: 'Xóa sản phẩm xóa các đánh giá tương ứng' })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: 'product_reviews' })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'user_id', bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ text: 'users.id' })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'SET NULL', bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ text: 'Người dùng xóa nick thì review vẫn giữ làm bằng chứng' })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: 'orders' })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'user_id', bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ text: 'users.id' })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'SET NULL', bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ text: 'Bảo toàn lịch sử đơn hàng và doanh thu kế toán' })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: 'order_items' })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'order_id', bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ text: 'orders.id' })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'CASCADE', bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ text: 'Xóa đơn hàng dọn dẹp toàn bộ dòng đơn hàng' })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: 'order_items' })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'variant_id', bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ text: 'product_variants.id' })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'SET NULL', bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ text: 'SKU bị xóa không làm sai lệch đơn hàng trong quá khứ' })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: 'payment_transactions' })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'order_id', bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ text: 'orders.id' })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'RESTRICT', bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ text: 'Nghiêm cấm xóa đơn hàng đã có bản ghi giao dịch ngân hàng' })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: 'store_inventories' })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'store_id', bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ text: 'stores.id' })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'CASCADE', bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ text: 'Đóng chi nhánh xóa các bản ghi kiểm kê kho' })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: 'store_inventories' })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'variant_id', bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ text: 'product_variants.id' })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'CASCADE', bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ text: 'Xóa biến thể tự động dọn kho tại tất cả chi nhánh' })] })
              ]
            })
          ]
        })
      ]
    }
  ]
});

const outPath = 'c:/Project/Neut-Studio/docs/ERD_Neut_Studio.docx';
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outPath, buffer);
  console.log(`Successfully generated updated Word Document: ${outPath} (${buffer.length} bytes)`);
});
