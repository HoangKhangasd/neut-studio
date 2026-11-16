import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchProductBySlug, fetchProducts } from '../../../lib/api';
import { ProductDetailView } from '../../../components/store/ProductDetailView';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);

  if (!product) {
    return (
      <div className="max-w-2xl mx-auto py-32 px-4 text-center">
        <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest block mb-2">
          ERROR 404 // PRODUCT NOT FOUND
        </span>
        <h1 className="text-3xl font-black uppercase tracking-tight text-black mb-4">
          SẢN PHẨM KHÔNG TỒN TẠI HOẶC ĐÃ NGỪNG KINH DOANH
        </h1>
        <p className="text-xs text-neutral-600 font-mono mb-8">
          Vui lòng quay lại danh mục sản phẩm để khám phá các bộ sưu tập mới nhất từ Neut-Studio.
        </p>
        <Link
          href="/shop"
          className="px-8 py-3.5 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-neutral-800 transition-colors"
        >
          QUAY LẠI CỬA HÀNG
        </Link>
      </div>
    );
  }

  // Fetch related products for the bottom section
  const { data: allProducts } = await fetchProducts();
  const relatedProducts = allProducts.filter((p) => p.id !== product.id);

  return (
    <div className="w-full min-h-screen bg-white">
      <ProductDetailView product={product} relatedProducts={relatedProducts} />
    </div>
  );
}
