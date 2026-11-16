# Thiết Kế Kỹ Thuật: Bảo Mật, State Machine Đơn Hàng & Tái Cấu Trúc Admin Panel

- **Dự án:** Neut-Studio Monorepo
- **Tài liệu tham chiếu:** `admin_audit_and_refactor_spec.md`
- **Ngày lập:** 2026-11-17
- **Trạng thái:** Chờ phê duyệt (Pending Approval)

---

## 1. Bối cảnh & Mục tiêu (Intent & The Why)

Hệ thống quản trị hiện tại của Neut-Studio đã có các chức năng cơ bản (đăng nhập, xem đơn hàng, CRUD sản phẩm, tồn kho theo size). Tuy nhiên, qua kiểm tra kỹ thuật (audit), hệ thống còn tồn tại các rủi ro bảo mật và khiếm khuyết nghiệp vụ nghiêm trọng:
1. **Thiếu phân quyền (RBAC):** Bất kỳ tài khoản khách hàng thông thường (`role: 'CUSTOMER'`) nào có JWT hợp lệ đều có thể gọi các API quản trị `/orders/admin/*` và `/products/admin/*` do thiếu `RolesGuard`.
2. **Sai lệch dữ liệu kho:** Khi đơn hàng chuyển trạng thái sang `CANCELLED`, hệ thống không hoàn lại `stockQuantity` cho các biến thể trong kho. Chuyển đổi trạng thái đơn hàng không có state machine chặn ngược chiều (ví dụ: đơn đã giao `COMPLETED` vẫn có thể bị đổi lại).
3. **Thông tin nhạy cảm:** Giao diện đăng nhập Admin đang điền sẵn mật khẩu mẫu; `jwt.strategy.ts` còn dùng chuỗi secret fallback cố định.
4. **Kiến trúc God-file:** Toàn bộ giao diện Admin đang dồn trong một file duy nhất `apps/web/src/app/admin/page.tsx` (>900 dòng), gây khó khăn cho việc mở rộng các module sau này.

---

## 2. Mục tiêu, Phi mục tiêu & Giới hạn (Goals, Non-Goals, Anti-Goals)

### Mục tiêu cốt lõi (Goals):
- Triển khai `@Roles('ADMIN')` và `RolesGuard` ở Backend; chặn truy cập UI Admin nếu user không mang quyền `ADMIN`.
- Xây dựng State Machine đơn hàng chặt chẽ: Chỉ cho phép chuyển đổi hợp lệ (`PENDING` -> `CONFIRMED`/`CANCELLED` -> `SHIPPING` -> `COMPLETED`).
- Hoàn trả chính xác số lượng tồn kho theo từng biến thể trong `order_items` khi đơn bị hủy (`CANCELLED`).
- Nâng cấp `getAdminOrders` hỗ trợ phân trang (`page`, `limit`), tìm kiếm (`orderCode`, tên, SĐT) và trả về đầy đủ danh sách món trong đơn.
- Tái cấu trúc Admin Frontend: Tách `apps/web/src/app/admin/` thành `layout.tsx` (Sidebar + Topbar + Auth Protection) và các trang route chuyên biệt:
  - `/admin` (Redirect hoặc Dashboard tóm tắt)
  - `/admin/orders` (Quản lý đơn hàng)
  - `/admin/products` (Quản lý sản phẩm & tồn kho)
- Sửa lỗi UI tự động logout khi gặp lỗi 500 hoặc rớt mạng; chỉ logout khi mã lỗi là `401` hoặc `403`.

### Phi mục tiêu (Non-Goals):
- **Bỏ qua quản lý Cửa hàng (`stores`):** Do người dùng đã quyết định gỡ bỏ tính năng Hệ thống cửa hàng khỏi storefront.
- Chưa triển khai đầy đủ ma trận biến thể động mở rộng (Phase 2: Dynamic Variant Matrix) và CRUD Coupons/Users trong đợt này.

### Anti-Goals:
- Không tạo các lớp abstraction phức tạp hoặc cài đặt thêm thư viện thừa thãi không cần thiết (tuân thủ nguyên tắc Ponytail).
- Không làm gián đoạn luồng đặt hàng và thanh toán hiện tại của khách hàng ở Storefront.

---

## 3. Các Phương Án Đã Cân Nhắc (Approaches)

1. **Phương án 1 (Chỉ sửa Logic tại chỗ):** Giữ nguyên file `admin/page.tsx`, chỉ vá `RolesGuard`, State Machine và hoàn kho.
   - *Ưu điểm:* Code ít nhất.
   - *Nhược điểm:* File `admin/page.tsx` tiếp tục phình to, nợ kỹ thuật tồn đọng.
2. **Phương án 2 (Được Người Dùng Lựa Chọn):** Kết hợp vá toàn diện bảo mật/logic nghiệp vụ ở Backend và tái cấu trúc chia tách layout + sub-routes cho Admin Frontend (`/admin/orders`, `/admin/products`).
   - *Lý do chọn:* Tạo nền tảng module sạch sẽ, chuẩn SRP (Single Responsibility Principle) để sẵn sàng cho các Phase tiếp theo (Coupons, Users, Analytics).

---

## 4. Thiết Kế Kỹ Thuật Chi Tiết (Detailed Architecture)

### 4.1. Backend (`apps/api`)

#### A. RBAC Security
- **`Roles` Decorator (`src/modules/auth/decorators/roles.decorator.ts`):**
  ```typescript
  import { SetMetadata } from '@nestjs/common';
  export const ROLES_KEY = 'roles';
  export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
  ```
- **`RolesGuard` (`src/modules/auth/guards/roles.guard.ts`):**
  - Đọc metadata từ `Reflector`.
  - Kiểm tra `request.user.role`. Nếu danh sách yêu cầu có `'ADMIN'` mà user không phải `'ADMIN'`, ném ngoại lệ `ForbiddenException('Bạn không có quyền truy cập tài nguyên này')`.
- **Gắn Guard:**
  - Áp dụng trên toàn bộ route Admin trong `orders.controller.ts` và `products.controller.ts`:
    ```typescript
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    ```
- **Bảo mật Secret:**
  - `jwt.strategy.ts`: Yêu cầu bắt buộc `config.getOrThrow<string>('JWT_ACCESS_SECRET')`, loại bỏ fallback hardcode.

#### B. State Machine Đơn Hàng & Hoàn Tồn Kho (`orders.service.ts`)
- **Bản đồ chuyển đổi trạng thái hợp lệ:**
  ```typescript
  const ALLOWED_TRANSITIONS: Record<string, string[]> = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['SHIPPING', 'CANCELLED'],
    SHIPPING: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
  };
  ```
- **Xử lý `updateOrderStatus(orderId, newStatus)` trong Transaction:**
  1. Kiểm tra đơn hàng hiện tại. Nếu `!ALLOWED_TRANSITIONS[currentStatus].includes(newStatus)`, ném `BadRequestException(`Không thể chuyển trạng thái từ ${currentStatus} sang ${newStatus}`)`.
  2. Nếu `newStatus === 'CANCELLED'` và `currentStatus !== 'CANCELLED'`:
     - Truy vấn toàn bộ `orderItems` của đơn đó.
     - Lặp qua từng item, gọi `UPDATE product_variants SET stock_quantity = stock_quantity + item.quantity WHERE id = item.variant_id`.
  3. Cập nhật `orderStatus = newStatus`, `updatedAt = NOW()`.

#### C. Phân Trang & Lọc Đơn Hàng (`getAdminOrders`)
- Nhận query params: `page = 1`, `limit = 20`, `status`, `search`.
- Trả về cấu trúc chuẩn:
  ```json
  {
    "data": [
      {
        "id": "...",
        "orderCode": "ORD-...",
        "orderStatus": "...",
        "items": [
          { "productTitle": "...", "size": "M", "color": "Đen", "quantity": 2, "price": 450000, "imageUrl": "..." }
        ]
      }
    ],
    "total": 100,
    "page": 1,
    "totalPages": 5
  }
  ```

---

### 4.2. Frontend (`apps/web`)

#### A. Cấu Trúc Thư Mục Admin Mới
```
apps/web/src/app/admin/
├── layout.tsx              # Admin Shell: Kiểm tra auth/role, Sidebar điều hướng, Topbar
├── page.tsx                # Trang tổng quan / redirect nhanh sang /admin/orders
├── orders/
│   └── page.tsx            # Quản lý đơn hàng (bảng, lọc status, đổi trạng thái)
└── products/
    └── page.tsx            # Quản lý kho sản phẩm (danh sách, tìm kiếm, nút Sửa/Xóa, thêm mới)
```

#### B. Trải Nghiệm Người Dùng (UI/UX)
- Gỡ bỏ hoàn toàn tài khoản/mật khẩu điền sẵn trên form đăng nhập.
- Hiển thị Toast thông báo khi cập nhật/xóa thành công hoặc gặp lỗi.
- Xử lý lỗi API: Chỉ redirect/logout khi nhận mã `401` hoặc `403`. Lỗi khác giữ nguyên màn hình và hiển thị thông báo lỗi chi tiết.

---

## 5. Kế Hoạch Kiểm Thử (Verification Plan)

1. **Kiểm tra RBAC:** Tạo user thường với `role: 'CUSTOMER'`. Gửi request gọi `GET /api/orders/admin/all` $\rightarrow$ Xác nhận trả về `403 Forbidden`.
2. **Kiểm tra State Machine:** Tạo đơn hàng `PENDING` $\rightarrow$ Đổi sang `COMPLETED` trực tiếp $\rightarrow$ Xác nhận trả về `400 Bad Request`.
3. **Kiểm tra Hoàn tồn kho:** Tạo đơn hàng gồm 2 sản phẩm (Size M: 2 cái). Kiểm tra tồn kho trước khi hủy. Chuyển đơn sang `CANCELLED` $\rightarrow$ Xác nhận tồn kho Size M tăng đúng 2 cái.
4. **Kiểm tra Layout Admin:** Đăng nhập tài khoản Admin, chuyển đổi mượt mà giữa `/admin/orders` và `/admin/products`.
