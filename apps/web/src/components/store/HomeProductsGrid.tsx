'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Product } from '../../lib/types';
import { ProductCard } from './ProductCard';

interface HomeProductsGridProps {
  initialProducts: Product[];
}

export function HomeProductsGrid({ initialProducts }: HomeProductsGridProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'tops' | 'bottoms' | 'accessories'>('all');

  const filteredProducts = initialProducts.filter((product) => {
    if (activeTab === 'all') return true;
    const t = product.title.toLowerCase();
    const s = product.slug.toLowerCase();
    if (activeTab === 'tops') return t.includes('áo') || t.includes('hoodie') || t.includes('tee') || t.includes('shirt') || s.includes('ao') || s.includes('hoodie');
    if (activeTab === 'bottoms') return t.includes('quần') || t.includes('jean') || t.includes('pant') || t.includes('short') || s.includes('quan');
    if (activeTab === 'accessories') return t.includes('balo') || t.includes('túi') || t.includes('bag') || t.includes('nón') || t.includes('phụ kiện') || s.includes('balo') || s.includes('bag');
    return true;
  });

  return (
    <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-black gap-4">
        <div>
          <span className="text-[11px] font-black tracking-[0.25em] uppercase text-neutral-500 block mb-1">
            LATEST DROPS // LIMITED EDITION
          </span>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
            SẢN PHẨM MỚI NHẤT
          </h2>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'TẤT CẢ' },
            { id: 'tops', label: 'ÁO THUN' },
            { id: 'bottoms', label: 'QUẦN' },
            { id: 'accessories', label: 'PHỤ KIỆN' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all border ${
                activeTab === tab.id
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-neutral-600 border-neutral-300 hover:border-black hover:text-black'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="py-16 text-center text-neutral-500 font-mono text-xs">
          Không có sản phẩm nào trong danh mục này.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* View All Button */}
      <div className="mt-12 text-center">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-black hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-widest transition-colors"
        >
          <span>XEM TẤT CẢ SẢN PHẨM</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
