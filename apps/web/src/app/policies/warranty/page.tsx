import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Sparkles, CheckCircle2, Wrench } from 'lucide-react';

export const metadata = {
  title: 'Chính Sách Bảo Hành Sản Phẩm Trọn Đời | Neut-Studio',
  description: 'Cam kết bảo hành đường may, khoá kéo kim loại và hình in trọn đời cho mọi sản phẩm Neut-Studio.',
};

export default function WarrantyPolicyPage() {
  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-neutral-500 hover:text-black mb-4 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại trang chủ</span>
          </Link>
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-neutral-500 block mb-1">
            STREETWEAR DURABILITY // LIFETIME COMMITMENT
          </span>
          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-black">
            CHÍNH SÁCH BẢO HÀNH TRỌN ĐỜI
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 font-mono mt-1">
            Được chế tác từ Heavyweight Cotton và kỹ thuật may cuốn viền cao cấp, Neut-Studio đồng hành trọn đời cùng món đồ của bạn.
          </p>
        </div>

        {/* 3 Pillars Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border-2 border-black p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <Wrench className="w-6 h-6 text-black mb-2" />
            <h3 className="text-xs font-black uppercase tracking-wider text-black">ĐƯỜNG CHỈ & VIỀN BO</h3>
            <p className="text-xs text-neutral-600 font-mono mt-1">
              Bảo hành miễn phí bung chỉ, đứt chỉ may viền cổ và gấu áo trọn đời.
            </p>
          </div>
          <div className="bg-white border-2 border-black p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <Sparkles className="w-6 h-6 text-black mb-2" />
            <h3 className="text-xs font-black uppercase tracking-wider text-black">HÌNH IN & ĐINH TÁN</h3>
            <p className="text-xs text-neutral-600 font-mono mt-1">
              Hỗ trợ ép nhiệt dính lại hình in tróc, thay thế phụ kiện kim loại/khuy đinh tán.
            </p>
          </div>
          <div className="bg-white border-2 border-black p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <ShieldCheck className="w-6 h-6 text-black mb-2" />
            <h3 className="text-xs font-black uppercase tracking-wider text-black">PHỤ KIỆN KHÓA KÉO</h3>
            <p className="text-xs text-neutral-600 font-mono mt-1">
              Thay mới đầu kéo YKK, khóa balo và dây rút chính hãng trọn đời sản phẩm.
            </p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="bg-white border-2 border-black p-6 sm:p-8 space-y-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-mono text-xs text-neutral-700 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-black flex items-center gap-2">
              <span className="w-2 h-2 bg-black inline-block"></span>
              1. CÁC HẠNG MỤC BẢO HÀNH MIỄN PHÍ TRỌN ĐỜI
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-neutral-600">
              <li>Sửa chữa các lỗi bung chỉ ở đường may viền nách, sườn áo, đũng quần hoặc quai đeo balo.</li>
              <li>Ép nhiệt gia cố hình in lụa tráng gương hoặc decal nếu có dấu hiệu bong góc viền.</li>
              <li>Thay thế cúc đinh tán kim loại (rivets) trên các dòng Jean / Denim.</li>
              <li>Thay củ khóa kéo (zipper puller) cho áo khoác Hoodie Zipper và Balo Utility.</li>
            </ul>
          </section>

          <section className="space-y-3 pt-4 border-t border-neutral-200">
            <h2 className="text-sm font-black uppercase tracking-wider text-black flex items-center gap-2">
              <span className="w-2 h-2 bg-black inline-block"></span>
              2. TRƯỜNG HỢP TỪ CHỐI BẢO HÀNH
            </h2>
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 space-y-1.5">
              <p>• Sản phẩm bị rách, thủng do vật sắc nhọn tác động cơ học hoặc tai nạn.</p>
              <p>• Sản phẩm bị ố màu, loang màu do giặt chung với quần áo ra màu hoặc đổ trực tiếp thuốc tẩy javel.</p>
              <p>• Hình in bị cháy rộp do là/ủi trực tiếp với nhiệt độ bàn ủi quá cao.</p>
              <p>• Sản phẩm đã qua chỉnh sửa, bóp eo, cắt ngắn từ bên thứ ba không thuộc xưởng may Neut-Studio.</p>
            </div>
          </section>

          <section className="space-y-3 pt-4 border-t border-neutral-200">
            <h2 className="text-sm font-black uppercase tracking-wider text-black flex items-center gap-2">
              <span className="w-2 h-2 bg-black inline-block"></span>
              3. QUY TRÌNH GỬI SẢN PHẨM BẢO HÀNH
            </h2>
            <ol className="list-decimal pl-5 space-y-2 text-neutral-600">
              <li>
                Chụp ảnh rõ nét chi tiết cần bảo hành (vết chỉ bung, khóa hỏng) và gửi về Zalo/Hotline <strong className="text-black">0933.800.190</strong>.
              </li>
              <li>
                Xưởng may độc lập tại TP.HCM tiếp nhận và đánh giá phương án phục hồi nguyên trạng.
              </li>
              <li>
                Gửi kiện hàng đến Atelier Neut-Studio. Thời gian xử lý phục hồi từ 3 - 5 ngày làm việc.
              </li>
            </ol>
          </section>
        </div>

        {/* Support Banner */}
        <div className="p-6 bg-white border border-neutral-300 text-center font-mono text-xs text-neutral-600">
          Chất lượng Streetwear là lời cam kết của chúng tôi. Mọi thắc mắc vui lòng liên hệ <span className="font-bold text-black">contact@neut.studio</span>.
        </div>
      </div>
    </div>
  );
}
