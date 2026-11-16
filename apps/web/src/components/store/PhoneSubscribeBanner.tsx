'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';
import { subscribeNewsletter } from '../../lib/api';

export function PhoneSubscribeBanner() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Vietnamese phone number regex validation
    const vnf_regex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!vnf_regex.test(phone)) {
      setErrorMsg('Vui lòng nhập số điện thoại Việt Nam hợp lệ (VD: 0912345678)');
      return;
    }

    setLoading(true);
    try {
      const res = await subscribeNewsletter(phone);
      setSuccess(true);
      setCouponCode(res.code || res.coupon || '');
    } catch {
      setErrorMsg('Đăng ký không thành công. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="bg-black text-white py-14 px-4 sm:px-6 border-y border-neutral-800">
      <div className="max-w-4xl mx-auto text-center">
        <span className="inline-block text-[11px] font-black tracking-[0.25em] uppercase text-neutral-400 mb-2">
          JOIN THE MOVEMENT // NEUT STREETWEAR
        </span>
        <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight mb-3">
          NHẬN VOUCHER GIẢM 10% CHO ĐƠN HÀNG ĐẦU TIÊN
        </h2>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-xl mx-auto mb-8 font-mono">
          Nhập số điện thoại để nhận ngay mã ưu đãi dành riêng cho thành viên mới và cập nhật các đợt Drop giới hạn sớm nhất.
        </p>

        {success ? (
          <div className="max-w-md mx-auto bg-neutral-900 border border-neutral-700 p-6 text-center animate-fade-in">
            <CheckCircle2 className="w-8 h-8 text-white mx-auto mb-2" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              ĐĂNG KÝ THÀNH CÔNG!
            </h3>
            <p className="text-xs text-neutral-400 mt-1 mb-4">
              Mã giảm giá 10% của bạn (áp dụng cho mọi đơn hàng từ 0đ):
            </p>
            <div className="flex items-center justify-center gap-2 bg-black border border-neutral-700 p-2.5 max-w-xs mx-auto">
              <span className="font-mono font-black text-lg text-white tracking-widest">
                {couponCode}
              </span>
              <button
                onClick={copyCode}
                className="p-1.5 hover:bg-neutral-800 transition-colors text-white"
                title="Sao chép mã"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            {copied && <span className="text-[11px] text-green-400 font-mono mt-1 block">Đã sao chép vào bộ nhớ tạm!</span>}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="tel"
                placeholder="NHẬP SỐ ĐIỆN THOẠI CỦA BẠN..."
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\s+/g, ''))}
                className="flex-1 bg-neutral-900 border border-neutral-700 text-white placeholder:text-neutral-500 text-xs sm:text-sm font-mono px-4 py-3 focus:outline-none focus:border-white transition-colors"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-white hover:bg-neutral-200 text-black text-xs font-black uppercase tracking-wider px-6 py-3 shrink-0 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {loading ? 'ĐANG GỬI...' : 'ĐĂNG KÝ'}
                {!loading && <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
            {errorMsg && (
              <div className="flex items-center justify-center gap-1.5 text-red-400 text-xs mt-3">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errorMsg}</span>
              </div>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
