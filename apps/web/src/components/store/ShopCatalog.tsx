'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Filter, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { Product } from '../../lib/types';
import { fetchProducts } from '../../lib/api';

interface ShopCatalogProps {
  initialProducts: Product[];
  initialTotal: number;
}

const SIZES = ['S', 'M', 'L', 'XL'];
const COLORS = [
  { name: 'Đen', hex: '#000000' },
  { name: 'Trắng', hex: '#FFFFFF' },
  { name: 'Xanh Wash', hex: '#4A5568' },
  { name: 'Xám Khói', hex: '#718096' },
];

const CATEGORIES = [
  { slug: 'all', name: 'Tất cả sản phẩm' },
  { slug: 'tops', name: 'Áo (Tops)' },
  { slug: 'bottoms', name: 'Quần (Bottoms)' },
  { slug: 'bags', name: 'Balo & Túi' },
  { slug: 'accessories', name: 'Phụ kiện' },
];

export function ShopCatalog({ initialProducts, initialTotal }: ShopCatalogProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [total, setTotal] = useState<number>(initialTotal);
  const [loading, setLoading] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Filter states derived from search params (supports both categorySlug and category)
  const currentCategory =
    searchParams.get('categorySlug') || searchParams.get('category') || 'all';
  const currentSort = searchParams.get('sortBy') || 'newest';
  const currentSearch = searchParams.get('search') || '';
  const currentSize = searchParams.get('sizes') || '';
  const currentColor = searchParams.get('colors') || '';

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('category'); // clean legacy param
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    router.push(`/shop?${params.toString()}`);
  };

  const clearAllFilters = () => {
    router.push('/shop');
  };

  // Re-fetch when searchParams change
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchProducts({
      categorySlug: currentCategory,
      sortBy: currentSort,
      search: currentSearch,
      sizes: currentSize,
      colors: currentColor,
    })
      .then((res) => {
        if (isMounted) {
          setProducts(res.data);
          setTotal(res.total);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentCategory, currentSort, currentSearch, currentSize, currentColor]);

  const hasActiveFilters =
    currentCategory !== 'all' || currentSize || currentColor || currentSearch;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb & Title */}
      <div className="mb-6 pb-4 border-b border-neutral-200 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-widest block mb-1">
            SHOPPING CATALOG // {total} SẢN PHẨM
          </span>
          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-black">
            {currentCategory === 'all'
              ? 'TẤT CẢ SẢN PHẨM'
              : CATEGORIES.find((c) => c.slug === currentCategory)?.name || 'DANH MỤC'}
          </h1>
          {currentSearch && (
            <p className="text-xs text-neutral-600 mt-1">
              Kết quả tìm kiếm cho: <span className="font-bold text-black">&quot;{currentSearch}&quot;</span>
            </p>
          )}
        </div>

        {/* Sort Dropdown & Mobile Filter Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="md:hidden flex items-center gap-2 px-4 py-2 border border-black text-xs font-bold uppercase"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Bộ Lọc</span>
          </button>

          <div className="flex items-center gap-2 border border-neutral-300 px-3 py-2 bg-white">
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-500" />
            <select
              value={currentSort}
              onChange={(e) => updateParam('sortBy', e.target.value)}
              className="text-xs font-bold uppercase tracking-wider bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="newest">Mới Nhất</option>
              <option value="price_asc">Giá: Thấp Đến Cao</option>
              <option value="price_desc">Giá: Cao Đến Thấp</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-6 p-3 bg-neutral-50 border border-neutral-200">
          <span className="text-xs font-bold uppercase text-neutral-500 mr-2">Đang lọc:</span>
          {currentCategory !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-black text-white text-xs font-mono">
              Danh mục: {CATEGORIES.find((c) => c.slug === currentCategory)?.name}
              <button onClick={() => updateParam('categorySlug', null)}>
                <X className="w-3 h-3 hover:text-red-400" />
              </button>
            </span>
          )}
          {currentSize && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-black text-white text-xs font-mono">
              Size: {currentSize}
              <button onClick={() => updateParam('sizes', null)}>
                <X className="w-3 h-3 hover:text-red-400" />
              </button>
            </span>
          )}
          {currentColor && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-black text-white text-xs font-mono">
              Màu: {currentColor}
              <button onClick={() => updateParam('colors', null)}>
                <X className="w-3 h-3 hover:text-red-400" />
              </button>
            </span>
          )}
          {currentSearch && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-black text-white text-xs font-mono">
              Tìm kiếm: {currentSearch}
              <button onClick={() => updateParam('search', null)}>
                <X className="w-3 h-3 hover:text-red-400" />
              </button>
            </span>
          )}
          <button
            onClick={clearAllFilters}
            className="text-xs font-bold uppercase tracking-wider underline hover:text-neutral-600 ml-auto"
          >
            Xóa Tất Cả
          </button>
        </div>
      )}

      {/* Main Layout: Left Sidebar + Right Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block space-y-8 pr-4 border-r border-neutral-200">
          {/* Categories */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-black mb-3 pb-2 border-b border-black">
              DANH MỤC SẢN PHẨM
            </h3>
            <div className="space-y-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => updateParam('categorySlug', cat.slug === 'all' ? null : cat.slug)}
                  className={`block w-full text-left text-xs font-bold uppercase py-1.5 px-2 transition-colors ${
                    currentCategory === cat.slug
                      ? 'bg-black text-white'
                      : 'text-neutral-700 hover:bg-neutral-100 hover:text-black'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Sizes */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-black mb-3 pb-2 border-b border-black">
              KÍCH THƯỚC (SIZE)
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => updateParam('sizes', currentSize === size ? null : size)}
                  className={`py-2 text-xs font-mono font-bold uppercase border transition-all ${
                    currentSize === size
                      ? 'bg-black text-white border-black'
                      : 'border-neutral-300 text-neutral-800 hover:border-black'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-black mb-3 pb-2 border-b border-black">
              MÀU SẮC
            </h3>
            <div className="space-y-2">
              {COLORS.map((color) => (
                <button
                  key={color.name}
                  onClick={() => updateParam('colors', currentColor === color.name ? null : color.name)}
                  className={`flex items-center gap-2.5 w-full text-left text-xs font-medium py-1.5 px-2 border transition-all ${
                    currentColor === color.name
                      ? 'border-black bg-neutral-100 font-bold'
                      : 'border-transparent hover:bg-neutral-50'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full border border-neutral-300"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span>{color.name}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Mobile Filter Modal */}
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-50 flex flex-col bg-white p-6 md:hidden animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-black mb-6">
              <span className="text-sm font-black uppercase tracking-wider">BỘ LỌC TÌM KIẾM</span>
              <button onClick={() => setIsMobileFilterOpen(false)}>
                <X className="w-6 h-6 text-black" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-6">
              {/* Categories */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider mb-2">DANH MỤC</h4>
                <div className="space-y-1">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.slug}
                      onClick={() => {
                        updateParam('categorySlug', cat.slug === 'all' ? null : cat.slug);
                        setIsMobileFilterOpen(false);
                      }}
                      className={`block w-full text-left text-xs font-bold uppercase py-2 px-3 ${
                        currentCategory === cat.slug ? 'bg-black text-white' : 'text-neutral-800'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sizes */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider mb-2">KÍCH THƯỚC</h4>
                <div className="grid grid-cols-4 gap-2">
                  {SIZES.map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        updateParam('sizes', currentSize === size ? null : size);
                        setIsMobileFilterOpen(false);
                      }}
                      className={`py-2 text-xs font-mono font-bold uppercase border ${
                        currentSize === size ? 'bg-black text-white border-black' : 'border-neutral-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="md:col-span-3">
          {loading ? (
            <div className="py-24 text-center">
              <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">
                ĐANG TẢI SẢN PHẨM...
              </span>
            </div>
          ) : products.length === 0 ? (
            <div className="py-24 text-center border border-dashed border-neutral-300 p-8">
              <p className="text-sm font-bold uppercase text-black mb-2">
                KHÔNG CÓ SẢN PHẨM PHÙ HỢP VỚI BỘ LỌC
              </p>
              <p className="text-xs text-neutral-500 font-mono mb-4">
                Vui lòng thử điều chỉnh lại bộ lọc kích thước, danh mục hoặc từ khóa tìm kiếm.
              </p>
              <button
                onClick={clearAllFilters}
                className="px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider"
              >
                XÓA TẤT CẢ BỘ LỌC
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
