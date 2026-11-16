# Hạ Tầng Dịch Vụ Neut-Studio (Docker Compose)

Thư mục chứa cấu hình hạ tầng cho dự án Neut-Studio:
- **PostgreSQL 16**: Port `5432` (CSDL quan hệ)
- **MinIO S3**: Port `9000` (S3 API) & Port `9001` (Web Console)
- **Redis 7.2**: Port `6379` (In-memory Cache & Queue)

## Khởi động từ thư mục gốc Monorepo:
```bash
# Khởi động toàn bộ container
pnpm infra:up

# Xem log thời gian thực
pnpm infra:logs

# Dừng container
pnpm infra:down
```
