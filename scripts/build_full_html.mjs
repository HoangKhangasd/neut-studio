import fs from 'node:fs';
import path from 'node:path';

const imgDir = 'c:/Project/Neut-Studio/docs/images';

function getBase64Img(filename) {
  const buf = fs.readFileSync(path.join(imgDir, filename));
  return 'data:image/png;base64,' + buf.toString('base64');
}

const sections = [
  {
    title: '1. Sơ Đồ ERD Toàn Diện (Master ERD - 22 Bảng)',
    desc: 'Bao quát toàn bộ 22 bảng thực thể và mối quan hệ giữa 6 phân hệ cốt lõi với đầy đủ các trường Khóa chính (PK) và Khóa ngoại (FK):',
    file: '01_master_erd.png'
  },
  {
    title: '2.1. Phân hệ Người Dùng & Phân Quyền (Authentication & Identity)',
    desc: 'Quản lý tài khoản, phân quyền vai trò (RBAC), sổ địa chỉ nhiều dòng và danh sách sản phẩm yêu thích (Wishlist):',
    file: '02_auth_users.png'
  },
  {
    title: '2.2. Phân hệ Danh Mục, Bộ Sưu Tập & Sản Phẩm (Catalog & Products)',
    desc: 'Cấu trúc danh mục phân cấp đệ quy (parent_id), bộ sưu tập Collab giới hạn, và chi tiết từng biến thể kích cỡ / màu sắc / tồn kho kèm ảnh lưu trữ trên MinIO S3:',
    file: '03_catalog_products.png'
  },
  {
    title: '2.3. Phân hệ Trải Nghiệm Mua Sắm & Đánh Giá (Lookbook & Reviews)',
    desc: 'Mua sắm qua điểm ghim Lookbook Hotspot tương tác (tọa độ %) và đánh giá sản phẩm kèm thông số chiều cao, cân nặng, fit_score để gợi ý size thông minh:',
    file: '04_lookbook_reviews.png'
  },
  {
    title: '2.4. Phân hệ Giỏ Hàng & Quản Lý Đơn Hàng (Cart & Orders)',
    desc: 'Giỏ hàng cookie cho khách vãng lai, tạo đơn hàng trừ kho nguyên tử (Atomicity), snapshot giá bán và thông tin sản phẩm trên chi tiết đơn để bảo toàn lịch sử kế toán:',
    file: '05_cart_orders.png'
  },
  {
    title: '2.5. Phân hệ Thanh Toán & Khuyến Mãi (Payments & Marketing)',
    desc: 'Cổng thanh toán trực tuyến (PayOS, VNPay) với mã Idempotent chống trùng lặp, cơ chế voucher giảm giá theo % hoặc số tiền, và thu thập số điện thoại nhận mã ưu đãi:',
    file: '06_payments_coupons.png'
  },
  {
    title: '2.6. Phân hệ Chuỗi Cửa Hàng & Tồn Kho Chi Nhánh (Stores & O2O)',
    desc: 'Tra cứu showroom thực tế và kiểm tra độ sẵn sàng của hàng hóa (In-store Stock Availability) theo từng size/màu tại từng địa điểm cửa hàng:',
    file: '07_stores_inventory.png'
  }
];

let html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Sơ Đồ Thực Thể Quan Hệ (ERD) - Neut-Studio E-Commerce</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; line-height: 1.6; color: #111; max-width: 1000px; margin: 0 auto; padding: 30px 20px; background: #fff; }
    h1 { font-size: 26px; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 12px; }
    h2 { font-size: 19px; margin-top: 32px; border-left: 4px solid #000; padding-left: 12px; margin-bottom: 12px; }
    p { font-size: 14px; margin-bottom: 12px; color: #333; }
    .meta { color: #555; font-size: 13px; margin-bottom: 28px; background: #f8f9fa; padding: 12px 16px; border-radius: 6px; }
    .img-box { text-align: center; margin: 20px 0 30px; }
    img { max-width: 100%; height: auto; border: 1px solid #e2e8f0; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
    th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; }
    th { background: #f1f5f9; font-weight: 700; }
    tr:nth-child(even) { background: #f8fafc; }
  </style>
</head>
<body>
  <h1>Sơ Đồ Thực Thể Quan Hệ (ERD) Hệ Thống Neut-Studio</h1>
  <div class="meta">
    <p><strong>Dự án:</strong> Neut-Studio Streetwear E-Commerce Monorepo | <strong>Hệ CSDL:</strong> PostgreSQL 16 | <strong>ORM:</strong> Drizzle ORM | <strong>Quy mô:</strong> 22 Bảng | <strong>Khóa chính:</strong> UUID v4</p>
  </div>
`;

for (const s of sections) {
  const b64 = getBase64Img(s.file);
  html += `
  <h2>${s.title}</h2>
  <p>${s.desc}</p>
  <div class="img-box">
    <img src="${b64}" alt="${s.title}" />
  </div>
`;
}

html += `
  <h2>3. Bảng Tổng Hợp Chi Tiết Các Trường Khóa Ngoại (Foreign Keys)</h2>
  <table>
    <thead>
      <tr>
        <th>Bảng Con</th>
        <th>Trường Khóa Ngoại (FK)</th>
        <th>Tham Chiếu Đến (PK)</th>
        <th>Hành Vi ON DELETE</th>
        <th>Mục Đích Nghiệp Vụ</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>user_addresses</code></td>
        <td><code>user_id</code></td>
        <td><code>users.id</code></td>
        <td><strong>CASCADE</strong></td>
        <td>Xóa tài khoản tự động dọn dẹp sổ địa chỉ</td>
      </tr>
      <tr>
        <td><code>wishlists</code></td>
        <td><code>user_id</code></td>
        <td><code>users.id</code></td>
        <td><strong>CASCADE</strong></td>
        <td>Xóa tài khoản giải phóng danh sách yêu thích</td>
      </tr>
      <tr>
        <td><code>categories</code></td>
        <td><code>parent_id</code></td>
        <td><code>categories.id</code></td>
        <td><strong>SET NULL</strong></td>
        <td>Xóa danh mục cha thì danh mục con chuyển lên cấp gốc (quan hệ đệ quy)</td>
      </tr>
      <tr>
        <td><code>products</code></td>
        <td><code>category_id</code></td>
        <td><code>categories.id</code></td>
        <td><strong>SET NULL</strong></td>
        <td>Xóa danh mục không làm mất dữ liệu sản phẩm</td>
      </tr>
      <tr>
        <td><code>product_variants</code></td>
        <td><code>product_id</code></td>
        <td><code>products.id</code></td>
        <td><strong>CASCADE</strong></td>
        <td>Xóa sản phẩm tự động xóa toàn bộ SKU phân loại</td>
      </tr>
      <tr>
        <td><code>product_images</code></td>
        <td><code>product_id</code></td>
        <td><code>products.id</code></td>
        <td><strong>CASCADE</strong></td>
        <td>Xóa sản phẩm xóa toàn bộ ảnh lưu trên MinIO S3</td>
      </tr>
      <tr>
        <td><code>collection_products</code></td>
        <td><code>collection_id</code></td>
        <td><code>collections.id</code></td>
        <td><strong>CASCADE</strong></td>
        <td>Xóa bộ sưu tập dọn dẹp liên kết sản phẩm thuộc BST</td>
      </tr>
      <tr>
        <td><code>product_reviews</code></td>
        <td><code>product_id</code></td>
        <td><code>products.id</code></td>
        <td><strong>CASCADE</strong></td>
        <td>Xóa sản phẩm xóa toàn bộ đánh giá liên quan</td>
      </tr>
      <tr>
        <td><code>orders</code></td>
        <td><code>user_id</code></td>
        <td><code>users.id</code></td>
        <td><strong>SET NULL</strong></td>
        <td>Bảo toàn dữ liệu đơn hàng và doanh thu khi tài khoản khách bị xóa</td>
      </tr>
      <tr>
        <td><code>order_items</code></td>
        <td><code>order_id</code></td>
        <td><code>orders.id</code></td>
        <td><strong>CASCADE</strong></td>
        <td>Xóa đơn hàng dọn dẹp toàn bộ dòng hàng chi tiết</td>
      </tr>
      <tr>
        <td><code>order_items</code></td>
        <td><code>variant_id</code></td>
        <td><code>product_variants.id</code></td>
        <td><strong>SET NULL</strong></td>
        <td>SKU bị xóa không làm sai lệch thông tin hóa đơn tài chính quá khứ</td>
      </tr>
      <tr>
        <td><code>payment_transactions</code></td>
        <td><code>order_id</code></td>
        <td><code>orders.id</code></td>
        <td><strong>RESTRICT</strong></td>
        <td>Nghiêm cấm xóa đơn hàng đã có bản ghi giao dịch ngân hàng/cổng thanh toán</td>
      </tr>
      <tr>
        <td><code>store_inventories</code></td>
        <td><code>store_id</code></td>
        <td><code>stores.id</code></td>
        <td><strong>CASCADE</strong></td>
        <td>Đóng chi nhánh xóa toàn bộ bản ghi kiểm kê kho tương ứng</td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;

fs.writeFileSync('c:/Project/Neut-Studio/docs/ERD_Report.html', html, 'utf8');
console.log('Saved docs/ERD_Report.html with embedded base64 images!');
