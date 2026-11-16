import React, { Suspense } from 'react';
import { OrderSuccessContent } from '../../components/store/OrderSuccessContent';

export default function OrderSuccessPage() {
  return (
    <div className="w-full min-h-screen bg-white">
      <Suspense
        fallback={
          <div className="py-32 text-center font-mono text-xs uppercase tracking-widest text-neutral-400">
            Đang tải dữ liệu đơn hàng...
          </div>
        }
      >
        <OrderSuccessContent />
      </Suspense>
    </div>
  );
}
