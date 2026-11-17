'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Phone, Mail, Clock, ShieldCheck, RefreshCw, Truck, ArrowUpRight } from 'lucide-react';

export function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;

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
              <p className="text-[11px] text-neutral-400">Cho mọi đơn hàng có giá trị từ 1.000.000₫</p>
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
            <p className="text-xs text-neutral-400 leading-relaxed mb-4 font-mono">
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
                <span>Hỗ trợ trực tuyến: 24/7</span>
              </div>
            </div>
          </div>

          {/* Column 2: Online Studio & Manifesto */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-neutral-200 mb-4">
              ONLINE STUDIO & ATELIER
            </h4>
            <div className="space-y-3 text-xs text-neutral-400 font-mono leading-relaxed">
              <p>
                Neut-Studio vận hành mô hình Direct-to-Consumer (D2C) trực tuyến toàn quốc với xưởng may độc lập tại TP. Hồ Chí Minh.
              </p>
              <div className="border border-neutral-800 p-3 bg-neutral-950">
                <span className="text-[11px] font-bold text-white uppercase block mb-1">
                  ĐÓNG GÓI CHUẨN XUẤT KHẨU
                </span>
                <p className="text-[11px] text-neutral-500">
                  Mỗi kiện hàng đều bao gồm hộp carton mộc, túi zip chống ẩm Neut-Bag, sticker độc quyền và thẻ bảo hành sản phẩm.
                </p>
              </div>
            </div>
          </div>

          {/* Column 3: Customer Policies & Support */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-neutral-200 mb-4">
              CHÍNH SÁCH & HỖ TRỢ
            </h4>
            <ul className="space-y-2.5 text-xs text-neutral-400 font-mono">
              <li>
                <Link href="/track-order" className="hover:text-white transition-colors flex items-center gap-1 text-white font-bold">
                  <span>Tra cứu hành trình đơn hàng</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </li>
              <li>
                <Link href="/policies/return" className="hover:text-white transition-colors">
                  Chính sách đổi trả & hoàn tiền 15 ngày
                </Link>
              </li>
              <li>
                <Link href="/policies/warranty" className="hover:text-white transition-colors">
                  Bảo hành hình in & đường may trọn đời
                </Link>
              </li>
              <li>
                <Link href="/size-guide" className="hover:text-white transition-colors">
                  Bảng thông số chọn size tiêu chuẩn
                </Link>
              </li>
              <li>
                <Link href="/policies/privacy" className="hover:text-white transition-colors">
                  Quy trình bảo mật thông tin khách hàng
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Payment & Security */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-neutral-200 mb-4">
              PHƯƠNG THỨC THANH TOÁN
            </h4>
            <p className="text-xs text-neutral-400 mb-4 font-mono">
              Hỗ trợ giao hàng và thanh toán an toàn, minh bạch trên toàn quốc:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <span className="p-2 border border-neutral-800 text-center text-white bg-neutral-950 font-bold">
                COD TẬN NƠI
              </span>
              <span className="p-2 border border-neutral-800 text-center text-neutral-300 bg-neutral-950 font-bold">
                ĐỒNG KIỂM HÀNG
              </span>
              <span className="p-2 border border-neutral-800 text-center text-neutral-300 bg-neutral-950 font-bold">
                FREESHIP 1TR+
              </span>
              <span className="p-2 border border-neutral-800 text-center text-neutral-300 bg-neutral-950 font-bold">
                BẢO HÀNH 100%
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
