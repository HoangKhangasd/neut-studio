import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock, EyeOff, Server } from 'lucide-react';

export const metadata = {
  title: 'Chính Sách Bảo Mật Thông Tin Khách Hàng | Neut-Studio',
  description: 'Cam kết bảo mật dữ liệu thông tin cá nhân khách hàng, địa chỉ giao hàng và mã hóa thanh toán.',
};

export default function PrivacyPolicyPage() {
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
            DATA SECURITY & PRIVACY // PCI-DSS STANDARDS
          </span>
          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-black">
            CHÍNH SÁCH BẢO MẬT THÔNG TIN
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 font-mono mt-1">
            Quy trình thu thập, xử lý và bảo vệ an toàn thông tin khách hàng tại hệ thống Neut-Studio.
          </p>
        </div>

        {/* 3 Pillars Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border-2 border-black p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <Lock className="w-6 h-6 text-black mb-2" />
            <h3 className="text-xs font-black uppercase tracking-wider text-black">MÃ HÓA ARGON2ID</h3>
            <p className="text-xs text-neutral-600 font-mono mt-1">
              Mật khẩu tài khoản được mã hóa một chiều an toàn tuyệt đối với thuật toán băm Argon2id.
            </p>
          </div>
          <div className="bg-white border-2 border-black p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <EyeOff className="w-6 h-6 text-black mb-2" />
            <h3 className="text-xs font-black uppercase tracking-wider text-black">KHÔNG CHIA SẺ 3P</h3>
            <p className="text-xs text-neutral-600 font-mono mt-1">
              Tuyệt đối không bán hay tiết lộ số điện thoại, email cho bên thứ ba vì mục đích quảng cáo rác.
            </p>
          </div>
          <div className="bg-white border-2 border-black p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <Server className="w-6 h-6 text-black mb-2" />
            <h3 className="text-xs font-black uppercase tracking-wider text-black">KẾT NỐI SSL/TLS</h3>
            <p className="text-xs text-neutral-600 font-mono mt-1">
              Mọi dữ liệu truyền tải giữa trình duyệt và máy chủ API đều được mã hóa kênh truyền TLS 1.3.
            </p>
          </div>
        </div>

        {/* Detailed Content */}
        <div className="bg-white border-2 border-black p-6 sm:p-8 space-y-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-mono text-xs text-neutral-700 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-black flex items-center gap-2">
              <span className="w-2 h-2 bg-black inline-block"></span>
              1. MỤC ĐÍCH THU THẬP THÔNG TIN
            </h2>
            <p>
              Neut-Studio chỉ thu thập các thông tin tối thiểu cần thiết để phục vụ quá trình xử lý đơn hàng và trải nghiệm mua sắm:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-neutral-600">
              <li>Họ và tên, số điện thoại, địa chỉ nhận hàng để in vận đơn giao hàng tận nơi.</li>
              <li>Địa chỉ email để gửi thông báo xác nhận đơn hàng, mã vận đơn và thông tin cập nhật sản phẩm mới (khi đăng ký nhận tin).</li>
              <li>Lịch sử đơn hàng để phục vụ việc bảo hành trọn đời và đổi trả trong 15 ngày.</li>
            </ul>
          </section>

          <section className="space-y-3 pt-4 border-t border-neutral-200">
            <h2 className="text-sm font-black uppercase tracking-wider text-black flex items-center gap-2">
              <span className="w-2 h-2 bg-black inline-block"></span>
              2. PHẠM VI SỬ DỤNG THÔNG TIN
            </h2>
            <p>Thông tin của khách hàng chỉ được sử dụng trong các trường hợp sau:</p>
            <ul className="list-disc pl-5 space-y-1 text-neutral-600">
              <li>Chuyển thông tin người nhận cho các đối tác vận chuyển uy tín (Giao Hàng Nhanh, Viettel Post).</li>
              <li>Hỗ trợ khách hàng xử lý khiếu nại, đổi size sản phẩm hoặc hoàn tiền.</li>
              <li>Phát hiện và ngăn chặn các hành vi gian lận đơn hàng giả mạo.</li>
            </ul>
          </section>

          <section className="space-y-3 pt-4 border-t border-neutral-200">
            <h2 className="text-sm font-black uppercase tracking-wider text-black flex items-center gap-2">
              <span className="w-2 h-2 bg-black inline-block"></span>
              3. QUYỀN LỢI CỦA KHÁCH HÀNG VỚI DỮ LIỆU CÁ NHÂN
            </h2>
            <p>
              Khách hàng có quyền yêu cầu tra cứu, chỉnh sửa hoặc xóa bỏ hoàn toàn dữ liệu thông tin cá nhân của mình trên hệ thống Neut-Studio bất kỳ lúc nào bằng cách gửi email về <span className="font-bold text-black">contact@neut.studio</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
