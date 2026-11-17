'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Product } from '../../lib/types';
import { formatVND } from '../../lib/utils';
import { useCartStore } from '../../stores/cart-store';
import { useAuthStore } from '../../stores/auth-store';
import { addToWishlist, removeFromWishlist } from '../../lib/account-api';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { addItem } = useCartStore();
  const { token } = useAuthStore();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('neut_wishlist');
      if (stored) {
        const ids = JSON.parse(stored);
        if (Array.isArray(ids) && ids.includes(product.id)) {
          setIsWishlisted(true);
        }
      }
    } catch {
      // ignore
    }
  }, [product.id]);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const stored = localStorage.getItem('neut_wishlist');
      let ids: string[] = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(ids)) ids = [];

      if (ids.includes(product.id)) {
        ids = ids.filter((id) => id !== product.id);
        setIsWishlisted(false);
        if (token) removeFromWishlist(token, product.id).catch(() => {});
      } else {
        ids.push(product.id);
        setIsWishlisted(true);
        if (token) addToWishlist(token, product.id).catch(() => {});
      }
      localStorage.setItem('neut_wishlist', JSON.stringify(ids));
    } catch {
      setIsWishlisted(!isWishlisted);
    }
  };

  const primaryImage = product.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800';
  const secondaryImage = product.images?.[1]?.imageUrl || primaryImage;

  const handleQuickAdd = (e: React.MouseEvent, size: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Find first variant matching this size that has stock
    const matchingVariant = product.variants?.find(
      (v) => v.size === size && v.stockQuantity > 0,
    );

    if (matchingVariant) {
      addItem({
        variantId: matchingVariant.id,
        productId: product.id,
        productTitle: product.title,
        productSlug: product.slug,
        imageUrl: primaryImage,
        colorName: matchingVariant.colorName,
        size: matchingVariant.size,
        price: matchingVariant.salePrice ?? matchingVariant.price,
        maxStock: matchingVariant.stockQuantity,
      });
    }
  };

  return (
    <div
      className="group relative flex flex-col bg-white"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 1. Image Container with 1:1 Aspect Ratio */}
      <div className="relative aspect-square w-full bg-neutral-100 overflow-hidden">
        {/* Badges */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
          {product.isFeatured && (
            <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
              New
            </span>
          )}
          {product.title.toLowerCase().includes('dcxab') && (
            <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
              Collab
            </span>
          )}
        </div>

        {/* Wishlist Heart */}
        <button
          onClick={toggleWishlist}
          className="absolute top-2 right-2 z-10 p-1.5 bg-white/80 hover:bg-white text-black transition-colors"
          title="Yêu thích"
        >
          <Heart size={16} className={isWishlisted ? 'fill-red-600 text-red-600' : 'text-neutral-700'} />
        </button>

        {/* Dual Flip Images on Hover */}
        <Link href={`/products/${product.slug}`} className="block w-full h-full">
          <Image
            src={isHovered ? secondaryImage : primaryImage}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
      </div>

      {/* 2. Quick Size Bar (Directly beneath image) */}
      {product.quickSizes && product.quickSizes.length > 0 && (
        <div className="flex items-center justify-center gap-2 py-2 border-b border-neutral-200 bg-white text-[11px] font-bold tracking-wider">
          {product.quickSizes.map((qs) => (
            <button
              key={qs.size}
              onClick={(e) => qs.inStock && handleQuickAdd(e, qs.size)}
              disabled={!qs.inStock}
              className={`px-1.5 py-0.5 transition-colors ${
                qs.inStock
                  ? 'hover:bg-black hover:text-white cursor-pointer text-black'
                  : 'text-neutral-300 line-through cursor-not-allowed'
              }`}
              title={qs.inStock ? `Chọn nhanh cỡ ${qs.size}` : `Cỡ ${qs.size} đã hết hàng`}
            >
              {qs.size}
            </button>
          ))}
        </div>
      )}

      {/* 3. Product Info */}
      <div className="pt-3 pb-1 flex flex-col flex-grow">
        <Link
          href={`/products/${product.slug}`}
          className="text-[13px] md:text-[14px] font-semibold text-neutral-900 hover:underline line-clamp-1 leading-snug"
        >
          {product.title}
        </Link>

        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-[14px] md:text-[15px] font-bold text-black tracking-tight">
            {formatVND(product.minPrice || product.originalPrice)}
          </span>
        </div>
      </div>
    </div>
  );
}
