# scripts/seed.ps1 - Gieo dữ liệu mẫu vào PostgreSQL
Write-Host "🌱 Bắt đầu seed dữ liệu mẫu vào PostgreSQL..." -ForegroundColor Cyan
pnpm db:seed
