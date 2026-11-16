import React from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Clock, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';

export const metadata = {
  title: 'Chính Sách Đổi Trả & Hoàn Tiền 15 Ngày | Neut-Studio',
  description: 'Chính sách đổi hàng tận nơi trong 15 ngày, quy trình hoàn tiền minh bạch cho khách hàng Neut-Studio.',
};

export default function ReturnPolicyPage() {
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
            CUSTOMER ASSURANCE // 15-DAY RETURN
          </span>
          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-black">
            CHÍNH SÁCH ĐỔI TRẢ & HOÀN TIỀN
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 font-mono mt-1">
            Hiệu lực từ ngày 01/01/2026. Áp dụng cho toàn bộ đơn hàng trực tuyến trên hệ thống Neut-Studio.
          </p>
        </div>

        {/* 3 Pillars Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border-2 border-black p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <Clock className="w-6 h-6 text-black mb-2" />
            <h3 className="text-xs font-black uppercase tracking-wider text-black">15 NGÀY ĐỔI HÀNG</h3>
            <p className="text-xs text-neutral-600 font-mono mt-1">
              Tính từ ngày bưu tá giao hàng thành công đến tay quý khách.
            </p>
          </div>
          <div className="bg-white border-2 border-black p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <RefreshCw className="w-6 h-6 text-black mb-2" />
            <h3 className="text-xs font-black uppercase tracking-wider text-black">ĐỔI SIZE TẬN NHÀ</h3>
            <p className="text-xs text-neutral-600 font-mono mt-1">
              Shipper mang size mới tới tận nơi và thu hồi sản phẩm cũ cùng lúc.
            </p>
          </div>
          <div className="bg-white border-2 border-black p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <CheckCircle2 className="w-6 h-6 text-black mb-2" />
            <h3 className="text-xs font-black uppercase tracking-wider text-black">LỖI 1 ĐỔI 1</h3>
            <p className="text-xs text-neutral-600 font-mono mt-1">
              Miễn phí 100% chi phí vận chuyển 2 chiều nếu phát sinh lỗi may mặc.
            </p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="bg-white border-2 border-black p-6 sm:p-8 space-y-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-mono text-xs text-neutral-700 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-black flex items-center gap-2">
              <span className="w-2 h-2 bg-black inline-block"></span>
              1. ĐIỀU KIỆN ÁP DỤNG ĐỔI TRẢ
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-neutral-600">
              <li>Sản phẩm còn nguyên vẹn tem, tag mác và túi zip chuyên dụng của Neut-Studio.</li>
              <li>Sản phẩm chưa qua giặt tẩy, không có mùi lạ (nước hoa, cơ thể), không bị rách bẩn hoặc can thiệp chỉnh sửa phom dáng.</li>
              <li>Có mã đơn hàng (Order Code) hoặc số điện thoại người đặt hàng để tra cứu trên hệ thống.</li>
              <li>Không áp dụng cho các sản phẩm nằm trong chương trình &quot;Clearance Sale / Xả Kho &gt; 50%&quot; (có ghi chú rõ tại mô tả).</li>
            </ul>
          </section>

          <section className="space-y-3 pt-4 border-t border-neutral-200">
            <h2 className="text-sm font-black uppercase tracking-wider text-black flex items-center gap-2">
              <span className="w-2 h-2 bg-black inline-block"></span>
              2. QUY TRÌNH ĐỔI HÀNG TẬN NƠI (O2O SERVICE)
            </h2>
            <ol className="list-decimal pl-5 space-y-2 text-neutral-600">
              <li>
                <strong>Bước 1:</strong> Khách hàng liên hệ Hotline <span className="text-black font-bold">0933.800.190</span> hoặc gửi email về <span className="text-black font-bold">contact@neut.studio</span> cung cấp mã đơn hàng và lý do muốn đổi.
              </li>
              <li>
                <strong>Bước 2:</strong> Bộ phận CSKH kiểm tra tồn kho sản phẩm/size mới và lên đơn đổi hàng 2 chiều.
              </li>
              <li>
                <strong>Bước 3:</strong> Bưu tá giao sản phẩm mới đến địa chỉ của bạn và đồng thời nhận lại sản phẩm cũ. Bạn không cần phải mang ra bưu cục gửi hàng.
              </li>
            </ol>
          </section>

          <section className="space-y-3 pt-4 border-t border-neutral-200">
            <h2 className="text-sm font-black uppercase tracking-wider text-black flex items-center gap-2">
              <span className="w-2 h-2 bg-black inline-block"></span>
              3. CHI PHÍ ĐỔI TRẢ
            </h2>
            <div className="p-4 bg-neutral-100 border border-neutral-300 space-y-2">
              <p>
                • <strong>Lỗi từ Neut-Studio</strong> (giao sai mẫu/size, rách chỉ, lem màu hình in): <strong>MIỄN PHÍ 100%</strong> toàn bộ chi phí vận chuyển phát sinh.
              </p>
              <p>
                • <strong>Nhu cầu đổi size hoặc đổi mẫu từ khách hàng</strong>: Neut-Studio hỗ trợ 50% cước phí vận chuyển (quý khách chỉ thanh toán phí đồng giá 25.000đ cho bưu tá).
              </p>
            </div>
          </section>

          <section className="space-y-3 pt-4 border-t border-neutral-200">
            <h2 className="text-sm font-black uppercase tracking-wider text-black flex items-center gap-2">
              <span className="w-2 h-2 bg-black inline-block"></span>
              4. CHÍNH SÁCH HOÀN TIỀN
            </h2>
            <p>
              Trường hợp sản phẩm hết size muốn đổi hoặc khách hàng không hài lòng và thỏa mãn điều kiện trả hàng:
            </p>
            <p>
              Neut-Studio sẽ hoàn tiền 100% giá trị sản phẩm qua tài khoản ngân hàng trong vòng 24 - 48 giờ làm việc sau khi kiện hàng hoàn về xưởng và vượt qua khâu kiểm định chất lượng (QC).
            </p>
          </section>
        </div>

        {/* Need Help Footer */}
        <div className="p-6 bg-white border border-neutral-300 text-center font-mono text-xs text-neutral-600">
          Cần hỗ trợ đổi hàng ngay lập tức? Gọi ngay Hotline <span className="font-bold text-black">0933.800.190</span> (9:00 - 22:00) hoặc tra cứu tại{' '}
          <Link href="/track-order" className="underline font-bold text-black hover:text-neutral-600">
            Trang Tra Cứu Đơn Hàng
          </Link>
          .
        </div>
      </div>
    </div>
  );
}
