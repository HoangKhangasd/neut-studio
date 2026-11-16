'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, X, ArrowRight, Loader2 } from 'lucide-react';
import { useCartStore } from '../../stores/cart-store';
import { fetchProducts } from '../../lib/api';
import { Product } from '../../lib/types';
import { formatVND } from '../../lib/utils';

const POPULAR_SEARCHES = ['Áo thun', 'Denim', 'DCxAB', 'Balo', 'Casual', 'Oversize'];

export function InstantSearchDrawer() {
  const { isSearchOpen, closeSearch } = useCartStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setResults([]);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSearchOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchOpen) {
        closeSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, closeSearch]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetchProducts({ search: query.trim() });
        setResults(res.data);
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-start bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full bg-white text-black shadow-2xl border-b border-black">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          {/* Header row with search input and close button */}
          <div className="flex items-center justify-between pb-4 border-b-2 border-black">
            <div className="flex items-center flex-1 space-x-3">
              <Search className="w-6 h-6 text-black shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="TÌM KIẾM THEO TÊN SẢN PHẨM, BST HOẶC MÀU SẮC..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full text-base sm:text-xl font-bold tracking-tight uppercase bg-transparent focus:outline-none placeholder:text-neutral-400 placeholder:normal-case"
              />
              {loading && <Loader2 className="w-5 h-5 animate-spin text-neutral-400 shrink-0" />}
            </div>
            <button
              onClick={closeSearch}
              className="ml-4 p-2 text-black hover:bg-neutral-100 rounded-none transition-colors"
              aria-label="Đóng tìm kiếm"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Quick suggestions / popular tags */}
          <div className="pt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 mr-2">
              Tìm kiếm phổ biến:
            </span>
            {POPULAR_SEARCHES.map((tag) => (
              <button
                key={tag}
                onClick={() => setQuery(tag)}
                className="px-3 py-1 text-xs uppercase font-medium border border-neutral-300 hover:border-black hover:bg-black hover:text-white transition-all"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Real-time search results */}
          {query.trim() && (
            <div className="mt-6 max-h-[60vh] overflow-y-auto">
              <div className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-3">
                {results.length > 0
                  ? `KẾT QUẢ TÌM KIẾM (${results.length})`
                  : !loading
                  ? 'KHÔNG TÌM THẤY SẢN PHẨM PHÙ HỢP'
                  : 'ĐANG TÌM KIẾM...'}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pb-6">
                {results.map((product) => {
                  const coverImage =
                    product.images?.find((img) => img.isCover)?.imageUrl ||
                    product.images?.[0]?.imageUrl ||
                    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80';

                  return (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      onClick={closeSearch}
                      className="group flex flex-col border border-neutral-200 hover:border-black transition-all bg-white"
                    >
                      <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-100">
                        <Image
                          src={coverImage}
                          alt={product.title}
                          fill
                          className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 100vw, 25vw"
                        />
                      </div>
                      <div className="p-3 flex flex-col flex-1 justify-between">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-tight text-black line-clamp-1 group-hover:underline">
                            {product.title}
                          </h4>
                          <p className="text-xs font-black text-black mt-1">
                            {formatVND(product.minPrice)}
                          </p>
                        </div>
                        {product.quickSizes && product.quickSizes.length > 0 && (
                          <div className="flex items-center gap-1 mt-2">
                            {product.quickSizes.map((qs) => (
                              <span
                                key={qs.size}
                                className={`text-[10px] font-semibold px-1.5 py-0.5 border ${
                                  qs.inStock
                                    ? 'border-neutral-300 text-neutral-800'
                                    : 'border-neutral-200 text-neutral-300 line-through'
                                }`}
                              >
                                {qs.size}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>

              {results.length > 0 && (
                <div className="pt-2 pb-4 text-center border-t border-neutral-100">
                  <Link
                    href={`/shop?search=${encodeURIComponent(query)}`}
                    onClick={closeSearch}
                    className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-black hover:underline"
                  >
                    Xem tất cả kết quả cho &quot;{query}&quot;
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Backdrop area click to close */}
      <div className="flex-1 w-full" onClick={closeSearch} />
    </div>
  );
}
