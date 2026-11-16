'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  ArrowRight,
  QrCode,
  AlertCircle,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import { trackOrder } from '../../lib/api';
import { formatVND } from '../../lib/utils';

export function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderCode = searchParams.get('code') || '';

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    // Fire confetti celebration once on mount
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#000000', '#555555', '#999999', '#ffffff'],
      });
    } catch {
      // Ignored if confetti fails in SSR
    }

    if (orderCode) {
      trackOrder(orderCode)
        .then((res) => setOrder(res))
        .catch((err) => setError(err.message || 'Không thể tải thông tin đơn hàng'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [orderCode]);

  const copyOrderCode = () => {
    if (orderCode) {
      navigator.clipboard.writeText(orderCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="py-32 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-black mb-3" />
        <span className="text-xs font-mono uppercase tracking-widest text-neutral-500">
          Đang xác thực thông tin đơn hàng...
        </span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h1 className="text-xl font-black uppercase text-black mb-2">
          {error || 'Không tìm thấy đơn hàng'}
        </h1>
        <p className="text-xs text-neutral-600 font-mono mb-6">
          Vui lòng kiểm tra lại mã đơn hàng hoặc liên hệ bộ phận hỗ trợ khách hàng.
        </p>
        <Link
          href="/shop"
          className="px-6 py-3 bg-black text-white text-xs font-bold uppercase tracking-wider"
        >
          Quay lại cửa hàng
        </Link>
      </div>
    );
  }

  const steps = [
    { key: 'PENDING', label: 'Tiếp Nhận Đơn', icon: Clock, desc: 'Hệ thống đã khóa tồn kho thành công' },
    { key: 'CONFIRMED', label: 'Đang Chuẩn Bị', icon: Package, desc: 'Đóng gói sản phẩm và in phiếu vận đơn' },
    { key: 'SHIPPING', label: 'Đang Giao Hàng', icon: Truck, desc: 'Bàn giao cho đơn vị vận chuyển' },
    { key: 'COMPLETED', label: 'Đã Giao Thành Công', icon: CheckCircle2, desc: 'Khách hàng đã nhận kiện hàng' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      {/* Top Success Banner */}
      <div className="text-center pb-8 border-b border-black">
        <div className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <span className="text-xs font-mono font-bold tracking-[0.25em] uppercase text-neutral-500 block mb-1">
          ORDER CONFIRMATION // SUCCESS
        </span>
        <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-black mb-2">
          ĐẶT HÀNG THÀNH CÔNG!
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 font-mono max-w-lg mx-auto">
          Cảm ơn bạn đã lựa chọn Neut-Studio. Kiện hàng đang được nhân viên chuẩn bị đóng gói cẩn thận.
        </p>

        {/* Order Code Pill */}
        <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-neutral-100 border border-neutral-300 font-mono text-sm font-black">
          <span>MÃ ĐƠN: {order.orderCode}</span>
          <button
            onClick={copyOrderCode}
            className="p-1 hover:bg-neutral-200 transition-colors"
            title="Sao chép mã đơn"
          >
            {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Real-time Order Tracking Timeline */}
      <div className="py-8 border-b border-neutral-200">
        <h3 className="text-xs font-black uppercase tracking-widest text-black mb-6">
          TIẾN TRÌNH XỬ LÝ ĐƠN HÀNG
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isCurrent = order.orderStatus === step.key;
            const isPassed =
              (order.orderStatus === 'CONFIRMED' && idx <= 1) ||
              (order.orderStatus === 'SHIPPING' && idx <= 2) ||
              order.orderStatus === 'COMPLETED';

            return (
              <div
                key={step.key}
                className={`p-4 border transition-all ${
                  isCurrent
                    ? 'border-black bg-neutral-900 text-white ring-2 ring-black'
                    : isPassed
                    ? 'border-neutral-400 bg-neutral-50 text-black'
                    : 'border-neutral-200 bg-white text-neutral-400'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-wider">
                    {step.label}
                  </span>
                </div>
                <p className={`text-[11px] font-mono leading-tight ${isCurrent ? 'text-neutral-300' : 'text-neutral-500'}`}>
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* PayOS QR Transfer Notice if selected */}
      {order.paymentMethod === 'PAYOS' && (
        <div className="my-8 p-6 bg-neutral-900 text-white border border-black flex flex-col md:flex-row items-center gap-6">
          <div className="w-32 h-32 bg-white p-2 shrink-0 flex items-center justify-center border border-neutral-700">
            <QrCode className="w-28 h-28 text-black" />
          </div>
          <div className="space-y-2 text-xs font-mono">
            <span className="px-2 py-0.5 bg-emerald-500 text-black font-black uppercase tracking-wider text-[10px]">
              VIETQR 24/7 TỰ ĐỘNG
            </span>
            <h4 className="text-base font-black uppercase text-white tracking-wide">
              THÔNG TIN CHUYỂN KHOẢN NGÂN HÀNG
            </h4>
            <p className="text-neutral-300">
              Ngân hàng: <strong className="text-white">MB Bank (Quân Đội)</strong> — STK: <strong className="text-white">9999.8888.6666</strong>
            </p>
            <p className="text-neutral-300">
              Chủ TK: <strong className="text-white">CONG TY TNHH NEUT STUDIO</strong>
            </p>
            <p className="text-neutral-300">
              Số tiền: <strong className="text-white">{formatVND(order.totalAmount)}</strong>
            </p>
            <p className="text-neutral-300">
              Nội dung CK: <strong className="text-emerald-400">{order.orderCode}</strong>
            </p>
            <p className="text-[11px] text-neutral-400 pt-1">
              * Hệ thống sẽ tự động gạch nợ và đổi trạng thái sang ĐÃ THANH TOÁN ngay khi nhận được tín hiệu Webhook IPN.
            </p>
          </div>
        </div>
      )}

      {/* Shipping & Order Items Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-b border-neutral-200">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-black mb-3">
            THÔNG TIN NHẬN HÀNG
          </h3>
          <div className="text-xs text-neutral-700 font-mono space-y-1 bg-neutral-50 p-4 border border-neutral-200">
            <p><strong>Người nhận:</strong> {order.customerName}</p>
            <p><strong>Số điện thoại:</strong> {order.customerPhone}</p>
            <p><strong>Email:</strong> {order.customerEmail}</p>
            <p>
              <strong>Địa chỉ:</strong>{' '}
              {order.shippingAddress?.street}, {order.shippingAddress?.ward},{' '}
              {order.shippingAddress?.district}, {order.shippingAddress?.province}
            </p>
            <p><strong>Hình thức thanh toán:</strong> {order.paymentMethod}</p>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-black mb-3">
            DANH SÁCH SẢN PHẨM ({order.items?.length || 0})
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {order.items?.map((item: any) => (
              <div
                key={item.id}
                className="p-3 border border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="font-bold uppercase text-black">{item.productTitle}</h4>
                  <p className="text-[11px] text-neutral-500 font-mono">
                    Size: {item.variantSize} • Màu: {item.variantColor} × {item.quantity}
                  </p>
                </div>
                <span className="font-black font-mono text-black">
                  {formatVND(item.totalPrice)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 flex justify-between items-baseline border-t border-neutral-300 mt-3 font-mono">
            <span className="text-xs font-bold uppercase text-neutral-700">Tổng thanh toán:</span>
            <span className="text-lg font-black text-black">{formatVND(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          href="/shop"
          className="w-full sm:w-auto px-8 py-3.5 bg-black hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-widest text-center transition-colors flex items-center justify-center gap-2"
        >
          <span>TIẾP TỤC MUA SẮM</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
