'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Package, Clock, CheckCircle2, Truck, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import { trackGuestOrder } from '../../lib/api';
import { CustomerOrder } from '../../lib/types';
import { formatVND } from '../../lib/utils';

const STATUS_STEPS = [
  { key: 'PENDING', label: 'Tiếp nhận đơn' },
  { key: 'CONFIRMED', label: 'Đã xác nhận' },
  { key: 'PROCESSING', label: 'Đóng gói kiện hàng' },
  { key: 'SHIPPING', label: 'Đang vận chuyển' },
  { key: 'COMPLETED', label: 'Giao thành công' },
];

export default function TrackOrderPage() {
  const [orderCode, setOrderCode] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<CustomerOrder | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderCode.trim()) {
      setError('Vui lòng nhập mã đơn hàng của bạn');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await trackGuestOrder(orderCode, phone);
      setOrder(data);
    } catch (err: any) {
      setError(err.message || 'Không tìm thấy thông tin đơn hàng');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const getStepStatus = (stepKey: string, currentStatus: string) => {
    if (currentStatus === 'CANCELLED') return 'cancelled';
    const statusOrder = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'COMPLETED'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(stepKey);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Breadcrumb */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-neutral-500 hover:text-black mb-4 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại trang chủ</span>
          </Link>
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-neutral-500 block mb-1">
            ORDER LOGISTICS TRACKING
          </span>
          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-black">
            TRA CỨU HÀNH TRÌNH ĐƠN HÀNG
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 font-mono mt-1">
            Kiểm tra trạng thái đóng gói, lịch trình giao hàng và chi tiết sản phẩm thời gian thực.
          </p>
        </div>

        {/* Search Form Card */}
        <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5">
                  MÃ ĐƠN HÀNG (BẮT BUỘC) *
                </label>
                <input
                  type="text"
                  placeholder="VD: NEUT-1731..."
                  value={orderCode}
                  onChange={(e) => setOrderCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 font-mono text-xs uppercase focus:outline-none focus:border-black"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5">
                  SỐ ĐIỆN THOẠI ĐẶT HÀNG (NẾU CÓ)
                </label>
                <input
                  type="tel"
                  placeholder="VD: 0933800190"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 font-mono text-xs focus:outline-none focus:border-black"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3 bg-black text-white text-xs font-black uppercase tracking-wider hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? 'ĐANG TÌM KIẾM...' : 'TRA CỨU TRẠNG THÁI'}</span>
            </button>
          </form>
        </div>

        {/* Order Details Output */}
        {order && (
          <div className="bg-white border-2 border-black p-6 sm:p-8 space-y-8 animate-fade-in shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-neutral-200 gap-4">
              <div>
                <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-widest block mb-0.5">
                  MÃ ĐƠN HÀNG
                </span>
                <span className="text-xl sm:text-2xl font-black font-mono text-black">
                  #{order.orderCode}
                </span>
                <p className="text-xs text-neutral-500 font-mono mt-1">
                  Ngày đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 text-xs font-black uppercase tracking-wider ${
                  order.orderStatus === 'COMPLETED'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : order.orderStatus === 'CANCELLED'
                    ? 'bg-red-100 text-red-800 border border-red-300'
                    : 'bg-black text-white'
                }`}>
                  TRẠNG THÁI: {order.orderStatus}
                </span>
              </div>
            </div>

            {/* Stepper Timeline */}
            {order.orderStatus !== 'CANCELLED' ? (
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-black mb-4">
                  TIẾN ĐỘ VẬN CHUYỂN
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {STATUS_STEPS.map((step, idx) => {
                    const status = getStepStatus(step.key, order.orderStatus);
                    return (
                      <div
                        key={step.key}
                        className={`p-3 border text-center transition-all ${
                          status === 'completed'
                            ? 'bg-neutral-100 border-black text-black'
                            : status === 'active'
                            ? 'bg-black text-white border-black ring-1 ring-black'
                            : 'bg-white border-neutral-200 text-neutral-400'
                        }`}
                      >
                        <div className="text-[10px] font-mono font-bold mb-1">BƯỚC 0{idx + 1}</div>
                        <div className="text-xs font-bold uppercase">{step.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-red-50 border border-red-300 text-red-700 text-xs font-mono">
                Đơn hàng này đã bị hủy. Quý khách vui lòng liên hệ bộ phận hỗ trợ khách hàng để biết thêm chi tiết.
              </div>
            )}

            {/* Shipping Info & Recipient */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-neutral-50 border border-neutral-200">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-black mb-2 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-neutral-700" />
                  <span>ĐỊA CHỈ NHẬN HÀNG</span>
                </h4>
                <div className="text-xs font-mono text-neutral-700 space-y-1">
                  <p className="font-bold text-black">{order.customerName}</p>
                  <p>Số điện thoại: {order.customerPhone}</p>
                  <p>Email: {order.customerEmail}</p>
                  <p className="pt-1">
                    Địa chỉ:{' '}
                    {[
                      order.shippingAddress?.street,
                      order.shippingAddress?.ward,
                      order.shippingAddress?.district,
                      order.shippingAddress?.province,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-black mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-neutral-700" />
                  <span>THANH TOÁN & BẢO HIỂM</span>
                </h4>
                <div className="text-xs font-mono text-neutral-700 space-y-1">
                  <p>Phương thức: <span className="font-bold text-black">{order.paymentMethod}</span></p>
                  <p>Trạng thái thanh toán: <span className="font-bold text-black">{order.paymentStatus}</span></p>
                  <p className="text-[11px] text-neutral-500 pt-2">
                    Kiện hàng được niêm phong chống ẩm và đồng kiểm tra hàng khi thanh toán COD.
                  </p>
                </div>
              </div>
            </div>

            {/* Items List */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-black mb-3">
                DANH SÁCH SẢN PHẨM TRONG ĐƠN ({order.items?.length || 0})
              </h3>
              <div className="border border-neutral-200 divide-y divide-neutral-200">
                {order.items?.map((item) => (
                  <div key={item.id} className="p-3.5 flex items-center justify-between text-xs font-mono">
                    <div>
                      <h4 className="font-bold text-black uppercase">{item.productTitle}</h4>
                      <p className="text-neutral-500 text-[11px] mt-0.5">
                        Phân loại: {item.variantColor} / Size {item.variantSize} • SKU: {item.variantSku}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-neutral-600">x{item.quantity}</p>
                      <p className="font-bold text-black mt-0.5">{formatVND(item.totalPrice)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="border-t border-neutral-200 pt-4 flex justify-end">
              <div className="w-full sm:w-72 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-neutral-600">
                  <span>Tạm tính:</span>
                  <span>{formatVND(order.subtotal)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-red-600 font-bold">
                    <span>Mã giảm giá:</span>
                    <span>-{formatVND(order.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-neutral-600">
                  <span>Phí vận chuyển:</span>
                  <span>{order.shippingFee === 0 ? 'MIỄN PHÍ' : formatVND(order.shippingFee)}</span>
                </div>
                <div className="flex justify-between text-sm font-black border-t border-black pt-2 text-black">
                  <span>TỔNG THANH TOÁN:</span>
                  <span>{formatVND(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Support Banner */}
        <div className="text-center p-6 bg-white border border-neutral-300 text-xs font-mono text-neutral-600">
          Cần hỗ trợ gấp về tình trạng đơn hàng? Liên hệ Hotline <span className="font-bold text-black">0933.800.190</span> hoặc Email <span className="font-bold text-black">contact@neut.studio</span>.
        </div>
      </div>
    </div>
  );
}
