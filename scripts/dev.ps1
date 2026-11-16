# scripts/dev.ps1 - Khởi chạy nhanh môi trường phát triển
Write-Host "🚀 Đang khởi động hệ thống Neut-Studio Monorepo..." -ForegroundColor Cyan

# Kiểm tra docker containers
Write-Host "📦 Kiểm tra hạ tầng Docker..." -ForegroundColor Yellow
docker compose -f infra/docker-compose.yml up -d

# Khởi chạy apps
Write-Host "🔥 Khởi chạy API và Web song song..." -ForegroundColor Green
pnpm dev
