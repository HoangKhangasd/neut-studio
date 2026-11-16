'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  MapPin,
  ShieldCheck,
  RefreshCw,
  Truck,
  ChevronDown,
  Plus,
  Minus,
  Check,
  ShoppingBag,
} from 'lucide-react';
import { Product, ProductVariant } from '../../lib/types';
import { formatVND } from '../../lib/utils';
import { useCartStore } from '../../stores/cart-store';
import { FitFinderModal } from './FitFinderModal';
import { StoreInventoryDrawer } from './StoreInventoryDrawer';
import { ProductReviewsSection } from './ProductReviewsSection';

interface ProductDetailViewProps {
  product: Product;
  relatedProducts: Product[];
}

export function ProductDetailView({ product, relatedProducts }: ProductDetailViewProps) {
  const router = useRouter();
  const { addItem, openCart } = useCartStore();

  // Find unique colors from variants
  const availableColors = useMemo(() => {
    const map = new Map<string, string>();
    product.variants?.forEach((v) => {
      if (!map.has(v.colorName)) {
        map.set(v.colorName, v.colorHex || '#000000');
      }
    });
    return Array.from(map.entries()).map(([name, hex]) => ({ name, hex }));
  }, [product.variants]);

  // States
  const [selectedColor, setSelectedColor] = useState<string>(
    availableColors[0]?.name || product.variants?.[0]?.colorName || '',
  );

  // Available sizes for the selected color
  const variantsForColor = useMemo(() => {
    return product.variants?.filter((v) => v.colorName === selectedColor) || [];
  }, [product.variants, selectedColor]);

  // First available in-stock size or first size
  const defaultVariant =
    variantsForColor.find((v) => v.stockQuantity > 0) || variantsForColor[0];

  const [selectedSize, setSelectedSize] = useState<string>(
    defaultVariant?.size || 'M',
  );

  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Modals state
  const [isFitFinderOpen, setIsFitFinderOpen] = useState(false);
  const [isStoreDrawerOpen, setIsStoreDrawerOpen] = useState(false);

  // Accordion state
  const [openAccordions, setOpenAccordions] = useState<{ [key: string]: boolean }>({
    desc: true,
    care: false,
    policy: false,
  });

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Current active variant
  const currentVariant = useMemo(() => {
    return product.variants?.find(
      (v) => v.colorName === selectedColor && v.size === selectedSize,
    );
  }, [product.variants, selectedColor, selectedSize]);

  // Filter images by selected color if attached
  const displayImages = useMemo(() => {
    if (!product.images || product.images.length === 0) {
      return [
        {
          id: 'placeholder',
          imageUrl:
            'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
          isCover: true,
          sortOrder: 0,
        },
      ];
    }
    const colorImgs = product.images.filter(
      (img) => !img.colorAttached || img.colorAttached === selectedColor,
    );
    return colorImgs.length > 0 ? colorImgs : product.images;
  }, [product.images, selectedColor]);

  const activeImage = displayImages[selectedImageIndex] || displayImages[0];
  const isOutOfStock = !currentVariant || currentVariant.stockQuantity <= 0;

  const handleAddToCart = () => {
    if (!currentVariant || isOutOfStock) return;

    addItem(
      {
        variantId: currentVariant.id,
        productId: product.id,
        productTitle: product.title,
        productSlug: product.slug,
        imageUrl: activeImage.imageUrl,
        colorName: currentVariant.colorName,
        size: currentVariant.size,
        price: currentVariant.salePrice || currentVariant.price,
        maxStock: currentVariant.stockQuantity,
      },
      quantity,
    );
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/checkout');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-xs font-mono uppercase text-neutral-500 mb-6">
        <Link href="/" className="hover:text-black">Trang Chủ</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-black">Cửa Hàng</Link>
        <span>/</span>
        <span className="text-black font-bold line-clamp-1">{product.title}</span>
      </nav>

      {/* Main 2-column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Image Gallery (7 cols) */}
        <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
          {/* Thumbnails */}
          {displayImages.length > 1 && (
            <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto shrink-0 md:w-20">
              {displayImages.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-16 h-20 md:w-20 md:h-24 shrink-0 border-2 overflow-hidden bg-neutral-100 transition-all ${
                    selectedImageIndex === idx ? 'border-black' : 'border-transparent hover:border-neutral-300'
                  }`}
                >
                  <Image
                    src={img.imageUrl}
                    alt={product.title}
                    fill
                    className="object-cover object-center"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Main Hero Image */}
          <div className="relative flex-1 aspect-[3/4] bg-neutral-100 border border-neutral-200 overflow-hidden group">
            <Image
              src={activeImage.imageUrl}
              alt={product.title}
              fill
              priority
              className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
            {currentVariant?.salePrice && (
              <span className="absolute top-4 left-4 bg-black text-white text-[11px] font-black uppercase px-2.5 py-1 tracking-widest">
                SALE OFF
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Sticky Buy Box (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-start space-y-6">
          <div>
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-neutral-500 block mb-1">
              NEUT STREETWEAR // SKU: {currentVariant?.sku || 'NEUT-ITEM'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black mb-3">
              {product.title}
            </h1>

            {/* Price display */}
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-black text-black">
                {formatVND(currentVariant?.salePrice || currentVariant?.price || product.minPrice)}
              </span>
              {currentVariant?.salePrice && (
                <span className="text-sm font-medium text-neutral-400 line-through">
                  {formatVND(currentVariant.price)}
                </span>
              )}
            </div>
          </div>

          {/* Color Selector */}
          {availableColors.length > 0 && (
            <div>
              <div className="flex justify-between items-center text-xs font-bold uppercase mb-2">
                <span>Màu Sắc:</span>
                <span className="font-mono text-neutral-600">{selectedColor}</span>
              </div>
              <div className="flex items-center gap-2">
                {availableColors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => {
                      setSelectedColor(color.name);
                      setSelectedImageIndex(0);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 border text-xs font-bold transition-all ${
                      selectedColor === color.name
                        ? 'border-black bg-black text-white'
                        : 'border-neutral-300 text-neutral-800 hover:border-black'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-neutral-400"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span>{color.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selector + Fit Finder Modal Trigger */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold uppercase mb-2">
              <span>Kích Thước:</span>
              <button
                type="button"
                onClick={() => setIsFitFinderOpen(true)}
                className="inline-flex items-center gap-1.5 text-[11px] font-black tracking-wider text-black underline hover:text-neutral-600 uppercase"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Gợi Ý Chọn Size (AI Fit)
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {variantsForColor.map((variant) => {
                const inStock = variant.stockQuantity > 0;
                const isSelected = selectedSize === variant.size;

                return (
                  <button
                    key={variant.id}
                    disabled={!inStock}
                    onClick={() => setSelectedSize(variant.size)}
                    className={`py-3 text-xs font-mono font-bold uppercase border transition-all ${
                      isSelected
                        ? 'bg-black text-white border-black ring-1 ring-black'
                        : inStock
                        ? 'border-neutral-300 text-neutral-800 hover:border-black'
                        : 'border-neutral-200 text-neutral-300 bg-neutral-50 line-through cursor-not-allowed'
                    }`}
                  >
                    {variant.size}
                  </button>
                );
              })}
            </div>

            {/* Stock status indicator */}
            <div className="mt-2 text-xs font-mono">
              {currentVariant && currentVariant.stockQuantity > 0 ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Còn {currentVariant.stockQuantity} sản phẩm sẵn sàng giao ngay
                </span>
              ) : (
                <span className="text-red-500 font-semibold">
                  Tạm hết hàng kích thước này
                </span>
              )}
            </div>
          </div>

          {/* Quantity Stepper */}
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold uppercase">Số Lượng:</span>
            <div className="flex items-center border border-neutral-300">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-2 hover:bg-neutral-100 transition-colors"
                disabled={quantity <= 1}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-10 text-center font-mono text-xs font-bold">
                {quantity}
              </span>
              <button
                onClick={() =>
                  setQuantity((q) =>
                    Math.min(currentVariant?.stockQuantity || 1, q + 1),
                  )
                }
                className="p-2 hover:bg-neutral-100 transition-colors"
                disabled={!currentVariant || quantity >= currentVariant.stockQuantity}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Main Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="w-full py-3.5 bg-black hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
            >
              <ShoppingBag className="w-4 h-4" />
              {isOutOfStock ? 'HẾT HÀNG' : 'THÊM VÀO GIỎ HÀNG'}
            </button>

            <button
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className="w-full py-3.5 border-2 border-black hover:bg-black hover:text-white text-black text-xs font-black uppercase tracking-widest transition-all disabled:opacity-40"
            >
              MUA NGAY (GIAO HỎA TỐC)
            </button>
          </div>

          {/* Store Availability Link */}
          <div className="pt-1">
            <button
              onClick={() => setIsStoreDrawerOpen(true)}
              className="w-full py-2.5 border border-dashed border-neutral-400 text-neutral-800 hover:border-black hover:text-black text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
            >
              <MapPin className="w-4 h-4 text-neutral-600" />
              Kiểm Tra Tồn Kho Tại 4 Chi Nhánh Cửa Hàng
            </button>
          </div>

          {/* Value Propositions Pill Grid */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-neutral-200 text-center">
            <div className="p-2.5 bg-neutral-50 border border-neutral-200">
              <RefreshCw className="w-4 h-4 mx-auto mb-1 text-neutral-700" />
              <span className="text-[10px] font-bold uppercase block">Đổi size 15 ngày</span>
            </div>
            <div className="p-2.5 bg-neutral-50 border border-neutral-200">
              <Truck className="w-4 h-4 mx-auto mb-1 text-neutral-700" />
              <span className="text-[10px] font-bold uppercase block">Freeship từ 500k</span>
            </div>
            <div className="p-2.5 bg-neutral-50 border border-neutral-200">
              <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-neutral-700" />
              <span className="text-[10px] font-bold uppercase block">Bảo hành trọn đời</span>
            </div>
          </div>

          {/* Accordion Specs */}
          <div className="border-t border-neutral-200 divide-y divide-neutral-200 pt-2">
            {/* Description */}
            <div>
              <button
                onClick={() => toggleAccordion('desc')}
                className="w-full py-3 flex items-center justify-between text-xs font-black uppercase tracking-wider text-left text-black"
              >
                <span>MÔ TẢ CHI TIẾT SẢN PHẨM</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    openAccordions.desc ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openAccordions.desc && (
                <div className="pb-4 text-xs text-neutral-600 leading-relaxed font-mono">
                  {product.description ||
                    'Sản phẩm thiết kế độc quyền từ Neut-Studio. Phom dáng Oversize chuẩn phong cách đường phố đương đại, kỹ thuật may cuốn viền cao cấp.'}
                </div>
              )}
            </div>

            {/* Material & Care */}
            <div>
              <button
                onClick={() => toggleAccordion('care')}
                className="w-full py-3 flex items-center justify-between text-xs font-black uppercase tracking-wider text-left text-black"
              >
                <span>CHẤT LIỆU & HƯỚNG DẪN GIẶT ỦI</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    openAccordions.care ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openAccordions.care && (
                <div className="pb-4 text-xs text-neutral-600 leading-relaxed font-mono space-y-1">
                  <p>• 100% Cotton 2 chiều định lượng 250gsm dệt độc quyền.</p>
                  <p>• Giặt máy ở nhiệt độ thường cùng quần áo có màu tương tự.</p>
                  <p>• Lộn trái áo khi giặt và ủi để bảo vệ độ bền hình in lụa tráng gương.</p>
                  <p>• Không sử dụng hóa chất tẩy rửa mạnh hoặc sấy nhiệt độ cao.</p>
                </div>
              )}
            </div>

            {/* Policies */}
            <div>
              <button
                onClick={() => toggleAccordion('policy')}
                className="w-full py-3 flex items-center justify-between text-xs font-black uppercase tracking-wider text-left text-black"
              >
                <span>CHÍNH SÁCH ĐỔI HÀNG & BẢO HÀNH</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    openAccordions.policy ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openAccordions.policy && (
                <div className="pb-4 text-xs text-neutral-600 leading-relaxed font-mono space-y-1">
                  <p>• Hỗ trợ đổi size tận nhà trong vòng 15 ngày kể từ ngày nhận hàng.</p>
                  <p>• Sản phẩm đổi còn nguyên tem mác và chưa qua giặt tẩy.</p>
                  <p>• Bảo hành miễn phí bung chỉ may và rạn nứt hình in trọn đời.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Community Product Reviews & Real Fit Gauge */}
      <ProductReviewsSection productSlug={product.slug} productTitle={product.title} />

      {/* Related Products Carousel / Grid */}
      {relatedProducts && relatedProducts.length > 0 && (
        <div className="mt-20 pt-10 border-t border-black">
          <div className="mb-8">
            <span className="text-[11px] font-black uppercase tracking-widest text-neutral-500 block">
              YOU MAY ALSO LIKE
            </span>
            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
              SẢN PHẨM CÙNG PHONG CÁCH
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.slice(0, 4).map((rel) => {
              const cover =
                rel.images?.find((i) => i.isCover)?.imageUrl ||
                rel.images?.[0]?.imageUrl ||
                'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80';
              return (
                <Link
                  key={rel.id}
                  href={`/products/${rel.slug}`}
                  className="group flex flex-col border border-neutral-200 hover:border-black transition-all bg-white"
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-100">
                    <Image
                      src={cover}
                      alt={rel.title}
                      fill
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, 25vw"
                    />
                  </div>
                  <div className="p-3">
                    <h4 className="text-xs font-bold uppercase tracking-tight text-black line-clamp-1 group-hover:underline">
                      {rel.title}
                    </h4>
                    <p className="text-xs font-black text-black mt-1">
                      {formatVND(rel.minPrice)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Fit Finder Modal */}
      <FitFinderModal
        isOpen={isFitFinderOpen}
        onClose={() => setIsFitFinderOpen(false)}
        onSelectSize={(size) => setSelectedSize(size)}
      />

      {/* Store Inventory Slide-over Drawer */}
      <StoreInventoryDrawer
        isOpen={isStoreDrawerOpen}
        onClose={() => setIsStoreDrawerOpen(false)}
        variantId={currentVariant?.id}
        productTitle={product.title}
        colorName={selectedColor}
        size={selectedSize}
      />
    </div>
  );
}
