# BỘ QUY CHUẨN KỸ THUẬT & THIẾT KẾ (ENGINEERING & DESIGN STANDARDS)
## DỰ ÁN: NEUT-STUDIO (FASHION E-COMMERCE)

> **NGUYÊN TẮC BẤT DI BẤT DỊCH TRONG TOÀN BỘ QUÁ TRÌNH PHÁT TRIỂN DỰ ÁN**

---

### 1. NGUYÊN TẮC CLEAN CODE & CẤU TRÚC MODULAR (KHÔNG GỘP CODE)
- **Single Responsibility Principle (SRP):** Mỗi file chỉ đảm nhận một trách nhiệm duy nhất. Tuyệt đối không tạo "God files" (file ôm đồm hàng trăm dòng xử lý lẫn lộn).
  - Giới hạn lý tưởng: Mỗi component / service dao động trong khoảng $80 - 200$ dòng. Nếu dài hơn, lập tức tách sub-components, custom hooks hoặc helper utils.
- **Tách bạch tầng Backend (NestJS):**
  - `Controller`: Chỉ nhận request, validate qua DTO và trả về response.
  - `Service`: Chỉ xử lý logic nghiệp vụ thuần túy, transaction và tính toán.
  - `Schema / Repository`: Quản lý truy vấn Drizzle ORM.
  - `DTOs / Types`: Định nghĩa kiểu dữ liệu và rule validate bằng `class-validator` / `zod`.
- **Tách bạch tầng Frontend (Next.js 15):**
  - Chia nhỏ các UI component nguyên tử: `ProductCard` tách riêng `QuickSizeBar`, `ProductBadges`, `ProductPrice`.
  - Toàn bộ logic gọi API, caching đưa vào **Custom Hooks** kết hợp **TanStack Query (React Query)**, không viết hàm `fetch` hay `useEffect` trực tiếp trong component giao diện.

---

### 2. QUY CHUẨN THIẾT KẾ UI/UX: TUYỆT ĐỐI "KHÔNG GIỐNG AI TẠO"
- **Nhận diện lỗi thiết kế của AI thường gặp (CẦN TRÁNH):**
  - Tránh các khối card bo góc tròn trĩnh bóng bẩy quá đà (`rounded-2xl`, `rounded-3xl`).
  - Tránh dải màu gradient tím/hồng vô định, hiệu ứng kính mờ (glassmorphism) rực rỡ không đúng ngữ cảnh.
  - Tránh layout cứng nhắc dạng template mẫu đơn điệu.
- **Quy chuẩn Streetwear Editorial đích thực (Chuẩn DirtyCoins):**
  - **Monochrome & High-Contrast:** Tông màu Đen - Trắng - Xám nhạt tách bạch rõ ràng.
  - **Đường nét sắc bén:** Dùng viền sắc cạnh `rounded-none` ($0\text{px}$) hoặc tối đa `rounded-sm` ($2\text{px}$). Nút bấm góc cạnh, đường kẻ mảnh `border-neutral-200`.
  - **Typography có nhịp điệu:** Tiêu đề `uppercase`, `tracking-wider` giãn chữ đậm chất lookbook tạp chí thời trang; nội dung mô tả dễ đọc, khoảng cách dòng thoáng đãng.
  - **Micro-interactions tinh tế:** Hover đổi mặt ảnh sau, thanh chọn size nhanh (`Quick Size Bar`) mượt mà, toast thông báo thanh lịch góc phải, drawer trượt êm ái.

---

### 3. QUY CHUẨN FRONTEND STATE VỚI TANSTACK QUERY (REACT QUERY)
- **Quản lý Server State tối ưu:**
  - Định nghĩa Query Keys Factory có tổ chức (`productKeys.all`, `productKeys.detail(id)`, `cartKeys.current`).
  - Cấu hình `staleTime` và `gcTime` hợp lý để tránh gọi API dư thừa.
  - Ứng dụng **Optimistic Updates** (Cập nhật giao diện tức thì) cho các thao tác: Thêm/Sửa/Xóa giỏ hàng, Thêm vào danh sách yêu thích (Wishlist). Khách hàng bấm là thấy đổi ngay, không bị khựng màn hình.
  - Sử dụng `keepPreviousData` / `placeholderData` khi chuyển trang bộ lọc và phân trang để trải nghiệm không bị chớp giật.

---

### 4. BẢO MẬT & TỐI ƯU HÓA HỆ THỐNG
- **Bảo mật thông tin:**
  - Mật khẩu băm bằng **Argon2id** (thuật toán an toàn nhất hiện nay).
  - JWT Access Token thời hạn ngắn + Refresh Token lưu trong `HTTP-Only, Secure, SameSite` Cookie chống XSS.
  - Sanitize input, chống SQL Injection qua Drizzle Parameterized Query, chống spam đơn hàng bằng Rate Limiter (Throttler).
  - Không bao giờ để lộ thông tin nhạy cảm trong response (luôn loại bỏ `password_hash`).
- **Tối ưu hóa hiệu năng:**
  - Database: Đánh chỉ mục Index cho các trường thường xuyên tìm kiếm, lọc (Size, Color, Price, Slug).
  - Assets: Ảnh upload được chuyển sang định dạng `.webp` và nén tối ưu qua `sharp`.
  - Code: Sử dụng dynamic import / React Suspense cho các modal, drawer nặng để giảm bundle size ban đầu.

---

### 5. QUY TẮC GIẢI QUYẾT KHI CÓ VƯỚNG MẮC (PROBLEM SOLVING)
- Khi gặp bài toán kỹ thuật phức tạp hoặc có sự đánh đổi (trade-offs), tôi sẽ luôn:
  1. Nêu rõ nguyên nhân gốc rễ (Root Cause) của vấn đề.
  2. Đưa ra ít nhất $2 - 3$ phương án giải quyết tối ưu kèm ưu / nhược điểm của từng phương án.
  3. Đề xuất phương án tốt nhất theo góc nhìn Senior Engineer để bạn dễ dàng quyết định.
