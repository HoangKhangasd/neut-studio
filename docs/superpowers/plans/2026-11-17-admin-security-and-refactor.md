# Admin Security Hardening, Order State Machine & Modular Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Triển khai bảo mật phân quyền RBAC (`RolesGuard`), chuẩn hóa State Machine đơn hàng & hoàn tồn kho khi hủy, và tái cấu trúc giao diện Admin của Neut-Studio thành các module layout chuyên biệt.

**Architecture:** 
- Backend: NestJS 11 + Drizzle ORM + Passport JWT. Bổ sung `RolesGuard` với metadata decorator `@Roles('ADMIN')`, đóng gói logic State Machine và hoàn kho trong transaction của Drizzle ORM, nâng cấp phân trang server-side cho đơn hàng.
- Frontend: Next.js 15 App Router. Tách `admin/page.tsx` thành `admin/layout.tsx` (Sidebar + Topbar + Auth Guard) cùng các route con `/admin/orders`, `/admin/products`.

**Tech Stack:** NestJS 11, TypeScript, Drizzle ORM, PostgreSQL 16, Next.js 15, Tailwind CSS, Lucide Icons.

**Spec:** `docs/superpowers/specs/2026-11-17-admin-security-and-refactor-design.md`

## Global Constraints
- Bắt buộc kiểm tra quyền `ADMIN` trên mọi endpoint bắt đầu bằng `/admin/*`.
- Nghiêm cấm hardcode mật khẩu, token hoặc fallback secret trong mã nguồn.
- Giữ vững quy chuẩn thiết kế Streetwear Brutalist (`rounded-none`, tông màu đen trắng tương phản cao, typography uppercase font-mono).
- Không phá vỡ luồng mua hàng và thanh toán hiện tại của khách hàng ở Storefront.

## Review Focus
- Tài khoản `CUSTOMER` cố tình gửi request sửa/xóa sản phẩm hoặc đổi trạng thái đơn $\rightarrow$ Phải nhận về `403 Forbidden`.
- Đổi trạng thái đơn từ `COMPLETED` hoặc `CANCELLED` ngược về `PENDING` $\rightarrow$ Phải nhận về `400 Bad Request`.
- Đơn hàng bị hủy (`CANCELLED`) $\rightarrow$ Toàn bộ số lượng trong `order_items` phải được cộng trả lại ngay lập tức vào `product_variants.stock_quantity`.
- Gặp lỗi mạng hoặc HTTP 500 khi fetch dữ liệu $\rightarrow$ Không được tự động logout người dùng, giữ nguyên phiên làm việc và hiển thị thông báo lỗi.
- Đăng nhập Admin $\rightarrow$ Không còn lưu mật khẩu mẫu sẵn trong ô input.

---

### Task 1: Backend Security Hardening & RBAC (RolesGuard & Secrets)

**Files:**
- Create: `apps/api/src/modules/auth/decorators/roles.decorator.ts`
- Create: `apps/api/src/modules/auth/guards/roles.guard.ts`
- Modify: `apps/api/src/modules/auth/jwt.strategy.ts`
- Modify: `apps/api/src/modules/auth/auth.module.ts`
- Modify: `apps/api/src/modules/orders/orders.controller.ts`
- Modify: `apps/api/src/modules/products/products.controller.ts`

- [ ] **Step 1.1:** Tạo decorator `@Roles(...roles: string[])` tại `apps/api/src/modules/auth/decorators/roles.decorator.ts`.
- [ ] **Step 1.2:** Tạo `RolesGuard` tại `apps/api/src/modules/auth/guards/roles.guard.ts`, trích xuất metadata bằng `Reflector`, kiểm tra `request.user.role === 'ADMIN'`. Nếu không khớp, ném `ForbiddenException('Bạn không có quyền truy cập tài nguyên quản trị')`.
- [ ] **Step 1.3:** Xuất `RolesGuard` trong `AuthModule` (`apps/api/src/modules/auth/auth.module.ts`).
- [ ] **Step 1.4:** Cập nhật `jwt.strategy.ts`: Bỏ fallback chuỗi bí mật cố định, sử dụng `config.getOrThrow<string>('JWT_ACCESS_SECRET')`.
- [ ] **Step 1.5:** Gắn `@UseGuards(JwtAuthGuard, RolesGuard)` và `@Roles('ADMIN')` trên toàn bộ các route admin trong `orders.controller.ts` và `products.controller.ts`.
- [ ] **Step 1.6:** Chạy lệnh build `@neut/api` và chạy script test kiểm chứng: Tài khoản `CUSTOMER` gọi API admin bị `403`, tài khoản `ADMIN` truy cập thành công `200`.

---

### Task 2: Order State Machine & Inventory Restoration on Cancellation

**Files:**
- Modify: `apps/api/src/modules/orders/orders.service.ts`
- Modify: `apps/api/src/modules/orders/orders.controller.ts`

- [ ] **Step 2.1:** Định nghĩa `ALLOWED_TRANSITIONS` map trong `orders.service.ts`:
  - `PENDING`: `['CONFIRMED', 'CANCELLED']`
  - `CONFIRMED`: `['SHIPPING', 'CANCELLED']`
  - `SHIPPING`: `['COMPLETED', 'CANCELLED']`
  - `COMPLETED`: `[]`
  - `CANCELLED`: `[]`
- [ ] **Step 2.2:** Cập nhật hàm `updateOrderStatus(id, newStatus)` trong `orders.service.ts` thực thi trong `this.db.transaction`:
  - Lấy trạng thái hiện tại của đơn hàng.
  - Kiểm tra `ALLOWED_TRANSITIONS[currentStatus].includes(newStatus)`. Nếu không hợp lệ, ném `BadRequestException`.
  - Nếu `newStatus === 'CANCELLED'` và `currentStatus !== 'CANCELLED'`: truy vấn `orderItems` của đơn, lặp qua từng món và cộng lại `stockQuantity` cho `productVariants`.
  - Cập nhật `orderStatus = newStatus`, `updatedAt = new Date()`.
- [ ] **Step 2.3:** Kiểm thử: Tạo đơn hàng thử nghiệm, đổi trạng thái không hợp lệ xác nhận nhận `400 Bad Request`; hủy đơn hàng xác nhận số lượng tồn kho tăng chính xác.

---

### Task 3: Server-side Pagination & Items Detail for Admin Orders

**Files:**
- Modify: `apps/api/src/modules/orders/dto/orders.dto.ts`
- Modify: `apps/api/src/modules/orders/orders.service.ts`
- Modify: `apps/api/src/modules/orders/orders.controller.ts`

- [ ] **Step 3.1:** Thêm DTO `AdminOrderQueryDto` với các trường `page`, `limit`, `status`, `search`.
- [ ] **Step 3.2:** Nâng cấp `getAdminOrders(query: AdminOrderQueryDto)`:
  - Lọc theo `orderStatus` (nếu khác 'ALL').
  - Tìm kiếm theo `orderCode`, `customerName`, `customerPhone` (sử dụng `ilike` hoặc `sql`).
  - Truy vấn danh sách `orderItems` tương ứng kèm thông tin sản phẩm và phân trang `{ data, total, page, totalPages }`.
- [ ] **Step 3.3:** Cập nhật endpoint trong `orders.controller.ts` nhận `@Query() query: AdminOrderQueryDto`.
- [ ] **Step 3.4:** Cập nhật hàm `fetchAdminOrders` trong `apps/web/src/lib/api.ts` hỗ trợ truyền query params.

---

### Task 4: Modular Admin Frontend Architecture (Layout & Sub-routes)

**Files:**
- Create: `apps/web/src/app/admin/layout.tsx`
- Create: `apps/web/src/app/admin/orders/page.tsx`
- Create: `apps/web/src/app/admin/products/page.tsx`
- Modify: `apps/web/src/app/admin/page.tsx`
- Modify: `apps/web/src/lib/api.ts`

- [ ] **Step 4.1:** Tạo `apps/web/src/app/admin/layout.tsx`:
  - Xử lý xác thực đăng nhập: Nếu chưa có `token` hoặc `user.role !== 'ADMIN'`, hiển thị form đăng nhập (để trống email/password, không hardcode).
  - Sidebar điều hướng: Dashboard, Quản lý đơn hàng (`/admin/orders`), Quản lý kho sản phẩm (`/admin/products`), nút Đăng xuất.
  - Topbar: Hiển thị tên Admin, trạng thái kết nối hệ thống.
- [ ] **Step 4.2:** Tạo `apps/web/src/app/admin/orders/page.tsx`:
  - Di chuyển bảng quản lý đơn hàng sang trang này.
  - Hỗ trợ thanh lọc trạng thái đầy đủ (ALL, PENDING, CONFIRMED, SHIPPING, COMPLETED, CANCELLED).
  - Xử lý xác nhận trước khi hủy đơn hàng (cảnh báo hoàn kho).
  - Bổ sung Drawer/Modal xem chi tiết các món trong đơn hàng.
- [ ] **Step 4.3:** Tạo `apps/web/src/app/admin/products/page.tsx`:
  - Di chuyển bảng sản phẩm, bộ lọc tìm kiếm, bộ đếm tồn kho nhanh, nút Thêm sản phẩm, nút Sửa (`EditProductModal`) và nút Xóa.
- [ ] **Step 4.4:** Cập nhật `apps/web/src/app/admin/page.tsx`:
  - Đóng vai trò trang Dashboard tổng quan (thống kê nhanh tổng đơn, doanh thu, cảnh báo sắp hết hàng) hoặc redirect mượt mà tới `/admin/orders`.
- [ ] **Step 4.5:** Sửa lỗi xử lý API: Chỉ logout khi HTTP status là `401` hoặc `403`; lỗi 500 hoặc mạng hiển thị thông báo lỗi, không tự đăng xuất.

---

### Task 5: Monorepo Build, E2E Verification & Git Push

**Files:**
- Toàn bộ monorepo

- [ ] **Step 5.1:** Chạy `pnpm build` toàn bộ monorepo (`@neut/types`, `@neut/api`, `@neut/web`) đảm bảo không có lỗi TypeScript hay build worker.
- [ ] **Step 5.2:** Chạy kịch bản kiểm thử E2E tự động:
  - Test 1: Customer token gọi API admin bị `403 Forbidden`.
  - Test 2: Chuyển trạng thái đơn hàng trái phép bị `400 Bad Request`.
  - Test 3: Hủy đơn hàng và xác thực hoàn tồn kho tự động trong DB.
  - Test 4: Kiểm tra HTTP status của `/admin/orders` và `/admin/products`.
- [ ] **Step 5.3:** Commit toàn bộ mã nguồn sạch với thông điệp Conventional Commits và đẩy lên GitHub `main`.
