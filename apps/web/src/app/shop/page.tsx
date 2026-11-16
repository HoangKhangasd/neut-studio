import React, { Suspense } from 'react';
import { fetchProducts } from '../../lib/api';
import { ShopCatalog } from '../../components/store/ShopCatalog';

export const revalidate = 60;

export default async function ShopPage() {
  const { data: initialProducts, total: initialTotal } = await fetchProducts();

  return (
    <div className="w-full min-h-screen bg-white">
      <Suspense
        fallback={
          <div className="py-24 text-center">
            <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">
              ĐANG TẢI CATALOG SẢN PHẨM...
            </span>
          </div>
        }
      >
        <ShopCatalog initialProducts={initialProducts} initialTotal={initialTotal} />
      </Suspense>
    </div>
  );
}
