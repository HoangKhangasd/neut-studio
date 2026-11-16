import React from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, ShieldCheck, RefreshCw, Truck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-black text-white border-t border-neutral-800">
      {/* 3 Pillars Value Proposition Bar */}
      <div className="border-b border-neutral-800 py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3.5">
            <RefreshCw className="w-6 h-6 text-neutral-400 shrink-0" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Đổi Hàng Trong 15 Ngày</h4>
              <p className="text-[11px] text-neutral-400">Đổi size tận nơi, miễn phí nếu lỗi từ nhà sản xuất</p>
            </div>
          </div>
          <div className="flex items-center justify-center md:justify-start gap-3.5">
            <Truck className="w-6 h-6 text-neutral-400 shrink-0" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Miễn Phí Giao Hàng Toàn Quốc</h4>
              <p className="text-[11px] text-neutral-400">Cho mọi đơn hàng có giá trị từ 500.000₫</p>
            </div>
          </div>
          <div className="flex items-center justify-center md:justify-start gap-3.5">
            <ShieldCheck className="w-6 h-6 text-neutral-400 shrink-0" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Chính Hãng 100%</h4>
              <p className="text-[11px] text-neutral-400">Cam kết chất lượng vải dệt độc quyền và hình in sắc nét</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main 4-column Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Column 1: Brand Info */}
          <div>
            <h3 className="text-lg font-black tracking-tighter uppercase mb-4 text-white">
              NEUT-STUDIO
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed mb-4">
              Thương hiệu thời trang Streetwear Việt Nam định hình phong cách hiện đại với form dáng Oversize, chất liệu Heavyweight Cotton và thiết kế đồ hoạ cá tính.
            </p>
            <div className="space-y-2 text-xs text-neutral-400 font-mono">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-neutral-300" />
                <span>Hotline: 0933.800.190 (9:00 - 22:00)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-neutral-300" />
                <span>Email: contact@neut.studio</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-neutral-300" />
                <span>Mở cửa: 9:30 - 22:00 hàng ngày</span>
              </div>
            </div>
          </div>

          {/* Column 2: Physical Stores */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-neutral-200 mb-4">
              HỆ THỐNG CỬA HÀNG
            </h4>
            <ul className="space-y-3 text-xs text-neutral-400">
              <li className="space-y-0.5">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-neutral-300 shrink-0" />
                  <span>Flagship Sư Vạn Hạnh (TP.HCM)</span>
                </div>
                <p className="text-[11px] text-neutral-400 pl-4.5">491 Sư Vạn Hạnh, Phường 12, Quận 10</p>
              </li>
              <li className="space-y-0.5">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-neutral-300 shrink-0" />
                  <span>Store Vincom Đồng Khởi (TP.HCM)</span>
                </div>
                <p className="text-[11px] text-neutral-400 pl-4.5">Tầng B2-08, 72 Lê Thánh Tôn, Bến Nghé, Quận 1</p>
              </li>
              <li className="space-y-0.5">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-neutral-300 shrink-0" />
                  <span>Store Đê La Thành (Hà Nội)</span>
                </div>
                <p className="text-[11px] text-neutral-400 pl-4.5">1023 Đê La Thành, Ba Đình</p>
              </li>
              <li className="pt-1">
                <Link
                  href="/stores"
                  className="inline-block text-xs font-bold text-white underline underline-offset-4 hover:text-neutral-300"
                >
                  Xem chi tiết 4 chi nhánh & tồn kho &rarr;
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Policies */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-neutral-200 mb-4">
              CHÍNH SÁCH & HỖ TRỢ
            </h4>
            <ul className="space-y-2.5 text-xs text-neutral-400">
              <li>
                <Link href="/shop" className="hover:text-white transition-colors">
                  Chính sách đổi trả & hoàn tiền 15 ngày
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-white transition-colors">
                  Bảo hành hình in và đường may trọn đời
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-white transition-colors">
                  Bảng thông số chọn size tiêu chuẩn
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-white transition-colors">
                  Quy trình bảo mật thông tin khách hàng
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-white transition-colors">
                  Cổng Quản Trị Hệ Thống (CMS Admin)
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Payment & Verification */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-neutral-200 mb-4">
              PHƯƠNG THỨC THANH TOÁN
            </h4>
            <p className="text-xs text-neutral-400 mb-4">
              Hỗ trợ đa dạng các hình thức thanh toán an toàn, bảo mật tiêu chuẩn mã hóa PCI-DSS:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <span className="p-2 border border-neutral-800 text-center text-neutral-300 bg-neutral-950 font-bold">
                COD TẬN NƠI
              </span>
              <span className="p-2 border border-neutral-800 text-center text-neutral-300 bg-neutral-950 font-bold">
                VIETQR 24/7
              </span>
              <span className="p-2 border border-neutral-800 text-center text-neutral-300 bg-neutral-950 font-bold">
                VNPAY / PAYOS
              </span>
              <span className="p-2 border border-neutral-800 text-center text-neutral-300 bg-neutral-950 font-bold">
                VISA / MASTER
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sub-footer */}
      <div className="border-t border-neutral-900 py-6 px-4 text-center text-xs text-neutral-500 font-mono">
        <p>© {new Date().getFullYear()} NEUT-STUDIO CO., LTD. ALL RIGHTS RESERVED. POWERED BY NEXT.JS 15 & NESTJS.</p>
      </div>
    </footer>
  );
}
