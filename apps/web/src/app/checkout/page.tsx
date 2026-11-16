'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  Truck,
  QrCode,
  Tag,
  AlertCircle,
  Loader2,
  Check,
  User as UserIcon,
} from 'lucide-react';
import { useCartStore } from '../../stores/cart-store';
import { useAuthStore } from '../../stores/auth-store';
import { formatVND } from '../../lib/utils';
import { createOrder } from '../../lib/api';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCartStore();
  const { user } = useAuthStore();

  const subtotal = getSubtotal();
  const shippingFee = subtotal >= 1000000 || subtotal === 0 ? 0 : 30000;

  // Form states
  const [formData, setFormData] = useState({
    customerName: user?.fullName || '',
    customerPhone: user?.phone || '',
    customerEmail: user?.email || '',
    province: 'TP. Hồ Chí Minh',
    district: 'Quận 10',
    ward: 'Phường 12',
    street: '',
  });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        customerName: prev.customerName || user.fullName,
        customerEmail: prev.customerEmail || user.email,
        customerPhone: prev.customerPhone || user.phone || '',
      }));
    }
  }, [user]);

  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'PAYOS' | 'VNPAY'>('COD');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const totalAmount = Math.max(0, subtotal + shippingFee - discountAmount);

  // Apply Coupon
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    if (couponCode.trim().toUpperCase() === 'NEUT10') {
      const discount = Math.min(100000, Math.round((subtotal * 10) / 100));
      setDiscountAmount(discount);
      setAppliedCoupon('NEUT10');
      setErrorMessage('');
    } else {
      setErrorMessage('Mã giảm giá không hợp lệ hoặc đã hết lượt sử dụng.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (items.length === 0) {
      setErrorMessage('Giỏ hàng của bạn đang trống.');
      return;
    }

    if (!formData.customerName || !formData.customerPhone || !formData.street) {
      setErrorMessage('Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ nhận hàng.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        userId: user?.id || undefined,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail || user?.email || 'guest@neut.studio',
        shippingAddress: {
          province: formData.province,
          district: formData.district,
          ward: formData.ward,
          street: formData.street,
        },
        paymentMethod,
        items: items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        couponCode: appliedCoupon || undefined,
      };

      const result = await createOrder(payload);

      // Clear Zustand cart
      clearCart();

      // Redirect to success confirmation
      router.push(`/order-success?code=${result.orderCode}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Đặt hàng thất bại. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-32 px-4 text-center">
        <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest block mb-2">
          CHECKOUT // GIỎ HÀNG TRỐNG
        </span>
        <h1 className="text-2xl font-black uppercase text-black mb-4">
          BẠN CHƯA CÓ SẢN PHẨM NÀO TRONG GIỎ HÀNG
        </h1>
        <p className="text-xs text-neutral-600 font-mono mb-8">
          Hãy chọn các mẫu áo thun, quần denim hoặc phụ kiện ưng ý trước khi tiến hành thanh toán.
        </p>
        <Link
          href="/shop"
          className="px-8 py-3.5 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-neutral-800 transition-colors"
        >
          TIẾP TỤC MUA SẮM
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-black"
        >
          <ArrowLeft className="w-4 h-4" />
          Tiếp tục mua hàng
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Checkout Form (7 cols) */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmitOrder} id="checkout-form" className="space-y-8">
            {/* 1. Customer Information */}
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-black pb-3 border-b-2 border-black mb-4 flex items-center justify-between">
                <span>1. THÔNG TIN NGƯỜI NHẬN</span>
                <span className="text-xs font-mono text-neutral-400 font-normal">BƯỚC 1/3</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">
                    Họ và tên người nhận *
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    required
                    placeholder="Nguyễn Văn A"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    className="w-full border border-neutral-300 p-2.5 text-xs font-medium focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">
                    Số điện thoại nhận hàng *
                  </label>
                  <input
                    type="tel"
                    name="customerPhone"
                    required
                    placeholder="0912345678"
                    value={formData.customerPhone}
                    onChange={handleInputChange}
                    className="w-full border border-neutral-300 p-2.5 text-xs font-medium focus:outline-none focus:border-black font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase mb-1">
                    Email nhận thông báo đơn hàng
                  </label>
                  <input
                    type="email"
                    name="customerEmail"
                    placeholder="customer@email.com"
                    value={formData.customerEmail}
                    onChange={handleInputChange}
                    className="w-full border border-neutral-300 p-2.5 text-xs font-medium focus:outline-none focus:border-black font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 2. Shipping Address */}
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-black pb-3 border-b-2 border-black mb-4 flex items-center justify-between">
                <span>2. ĐỊA CHỈ GIAO HÀNG TẬN NƠI</span>
                <span className="text-xs font-mono text-neutral-400 font-normal">BƯỚC 2/3</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Tỉnh / Thành phố *</label>
                  <select
                    name="province"
                    value={formData.province}
                    onChange={handleInputChange}
                    className="w-full border border-neutral-300 p-2.5 text-xs font-medium focus:outline-none focus:border-black bg-white"
                  >
                    <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="Đà Nẵng">Đà Nẵng</option>
                    <option value="Hải Phòng">Hải Phòng</option>
                    <option value="Cần Thơ">Cần Thơ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Quận / Huyện *</label>
                  <input
                    type="text"
                    name="district"
                    required
                    value={formData.district}
                    onChange={handleInputChange}
                    placeholder="Quận 10"
                    className="w-full border border-neutral-300 p-2.5 text-xs font-medium focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Phường / Xã *</label>
                  <input
                    type="text"
                    name="ward"
                    required
                    value={formData.ward}
                    onChange={handleInputChange}
                    placeholder="Phường 12"
                    className="w-full border border-neutral-300 p-2.5 text-xs font-medium focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1">
                  Địa chỉ chi tiết (Số nhà, tên đường, tòa nhà) *
                </label>
                <input
                  type="text"
                  name="street"
                  required
                  placeholder="Ví dụ: 561 Sư Vạn Hạnh, Căn hộ A12..."
                  value={formData.street}
                  onChange={handleInputChange}
                  className="w-full border border-neutral-300 p-2.5 text-xs font-medium focus:outline-none focus:border-black"
                />
              </div>
            </div>

            {/* 3. Payment Method */}
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-black pb-3 border-b-2 border-black mb-4 flex items-center justify-between">
                <span>3. PHƯƠNG THỨC THANH TOÁN</span>
                <span className="text-xs font-mono text-neutral-400 font-normal">BƯỚC 3/3</span>
              </h2>

              <div className="space-y-3">
                {/* Option 1: COD */}
                <label
                  className={`flex items-start gap-3.5 p-4 border cursor-pointer transition-all ${
                    paymentMethod === 'COD'
                      ? 'border-black bg-neutral-50 ring-1 ring-black'
                      : 'border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="mt-1 accent-black"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-black" />
                      <span className="text-xs font-bold uppercase">
                        Thanh toán khi nhận hàng (COD)
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Nhận hàng, kiểm tra tem mác và thanh toán tiền mặt trực tiếp cho nhân viên giao vận.
                    </p>
                  </div>
                </label>

                {/* Option 2: PayOS QR */}
                <label
                  className={`flex items-start gap-3.5 p-4 border cursor-pointer transition-all ${
                    paymentMethod === 'PAYOS'
                      ? 'border-black bg-neutral-50 ring-1 ring-black'
                      : 'border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="PAYOS"
                    checked={paymentMethod === 'PAYOS'}
                    onChange={() => setPaymentMethod('PAYOS')}
                    className="mt-1 accent-black"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-black" />
                      <span className="text-xs font-bold uppercase">
                        Chuyển khoản VietQR 24/7 (PayOS)
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Quét mã QR tự động điền số tài khoản, số tiền và nội dung chuyển khoản bảo mật tức thì.
                    </p>
                  </div>
                </label>

                {/* Option 3: VNPay */}
                <label
                  className={`flex items-start gap-3.5 p-4 border cursor-pointer transition-all ${
                    paymentMethod === 'VNPAY'
                      ? 'border-black bg-neutral-50 ring-1 ring-black'
                      : 'border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="VNPAY"
                    checked={paymentMethod === 'VNPAY'}
                    onChange={() => setPaymentMethod('VNPAY')}
                    className="mt-1 accent-black"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-black" />
                      <span className="text-xs font-bold uppercase">
                        Cổng thanh toán VNPAY / Thẻ Visa / Mastercard
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Hỗ trợ thẻ ATM nội địa có Internet Banking, ví VNPAY và thẻ quốc tế.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 flex items-center gap-2 text-red-600 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </form>
        </div>

        {/* Right Column: Order Summary (5 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-neutral-50 border border-neutral-200 p-6 sticky top-24">
            <h3 className="text-xs font-black uppercase tracking-widest text-black pb-3 border-b border-black mb-4">
              TỔNG ĐƠN HÀNG ({items.length} SẢN PHẨM)
            </h3>

            {/* Items List */}
            <div className="max-h-72 overflow-y-auto space-y-3 pr-1 mb-6 divide-y divide-neutral-200">
              {items.map((item) => (
                <div key={item.variantId} className="pt-3 first:pt-0 flex items-center gap-3">
                  <div className="relative w-14 h-18 bg-white border border-neutral-200 shrink-0 overflow-hidden">
                    <Image
                      src={item.imageUrl}
                      alt={item.productTitle}
                      fill
                      className="object-cover object-center"
                      sizes="60px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold uppercase text-black truncate">
                      {item.productTitle}
                    </h4>
                    <p className="text-[11px] text-neutral-500 font-mono">
                      {item.colorName} / Size {item.size} × {item.quantity}
                    </p>
                    <p className="text-xs font-black text-black mt-0.5">
                      {formatVND(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon Code Input */}
            <form onSubmit={handleApplyCoupon} className="mb-6 pb-4 border-b border-neutral-200">
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-neutral-600">
                MÃ GIẢM GIÁ (VOUCHER)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="NHẬP VÍ DỤ: NEUT10"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 border border-neutral-300 p-2 text-xs font-mono font-bold focus:outline-none focus:border-black uppercase"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
                >
                  Áp Dụng
                </button>
              </div>
              {appliedCoupon && (
                <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-mono mt-2 font-bold">
                  <Check className="w-3.5 h-3.5" />
                  <span>Đã áp dụng mã {appliedCoupon} (-{formatVND(discountAmount)})</span>
                </div>
              )}
            </form>

            {/* Cost Breakdown */}
            <div className="space-y-2 text-xs font-mono pb-4 border-b border-neutral-200">
              <div className="flex justify-between">
                <span className="text-neutral-600">Tạm tính hàng hóa:</span>
                <span className="font-bold">{formatVND(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Phí vận chuyển toàn quốc:</span>
                <span className="font-bold">
                  {shippingFee === 0 ? 'MIỄN PHÍ' : formatVND(shippingFee)}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Giảm giá voucher:</span>
                  <span>-{formatVND(discountAmount)}</span>
                </div>
              )}
            </div>

            {/* Grand Total */}
            <div className="flex justify-between items-baseline py-4">
              <span className="text-xs font-black uppercase tracking-wider text-black">
                TỔNG CỘNG THANH TOÁN:
              </span>
              <span className="text-2xl font-black text-black">
                {formatVND(totalAmount)}
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              form="checkout-form"
              disabled={loading}
              className="w-full py-4 bg-black hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  ĐANG KHÓA TỒN KHO & TẠO ĐƠN...
                </>
              ) : (
                'XÁC NHẬN HOÀN TẤT ĐẶT HÀNG'
              )}
            </button>

            {/* Security Guarantee */}
            <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-neutral-500 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
              <span>Giao dịch bảo mật 100% bằng chứng chỉ mã hóa SSL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
