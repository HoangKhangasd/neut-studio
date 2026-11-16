import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { fetchProducts } from '../lib/api';
import { HomeProductsGrid } from '../components/store/HomeProductsGrid';
import { PhoneSubscribeBanner } from '../components/store/PhoneSubscribeBanner';

export const revalidate = 60;

export default async function HomePage() {
  const { data: initialProducts } = await fetchProducts();

  return (
    <div className="w-full flex flex-col">
      {/* 1. STREETWEAR HERO LOOKBOOK */}
      <section className="relative w-full h-[75vh] sm:h-[85vh] bg-black text-white flex items-center justify-center overflow-hidden">
        {/* Background Image with Dark Contrast Overlay */}
        <div className="absolute inset-0 z-0 opacity-60">
          <Image
            src="https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1800&auto=format&fit=crop&q=80"
            alt="Neut Studio Lookbook"
            fill
            priority
            className="object-cover object-center filter grayscale contrast-125"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />

        {/* Hero Content */}
        <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-block px-3 py-1 bg-white text-black text-[11px] font-black uppercase tracking-[0.3em] mb-4">
            AUTUMN / WINTER 2026 DROP
          </span>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-6">
            URBAN REVOLUTION <br />
            <span className="font-light italic text-neutral-300">NEUT-STUDIO</span>
          </h1>
          <p className="max-w-xl mx-auto text-xs sm:text-sm text-neutral-300 font-mono mb-8 uppercase tracking-wider">
            Heavyweight 250gsm Cotton // Oversize Fit // Hand-crafted Wash Finish
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/shop"
              className="w-full sm:w-auto px-8 py-3.5 bg-white text-black hover:bg-neutral-200 text-xs font-black uppercase tracking-widest transition-colors"
            >
              KHÁM PHÁ BỘ SƯU TẬP
            </Link>
            <Link
              href="/shop?collectionSlug=collab-all-blacks"
              className="w-full sm:w-auto px-8 py-3.5 border-2 border-white text-white hover:bg-white hover:text-black text-xs font-black uppercase tracking-widest transition-all"
            >
              COLLECTION COLLAB DCxAB
            </Link>
          </div>
        </div>
      </section>

      {/* 2. BENTO CATEGORY GRID */}
      <section className="py-12 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: 'TOPS // ÁO THUN',
              subtitle: 'Heavyweight Tee & Hoodie',
              href: '/shop?categorySlug=ao-tops',
              image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
            },
            {
              title: 'BOTTOMS // QUẦN',
              subtitle: 'Wide-Leg Denim & Rivets',
              href: '/shop?categorySlug=quan-bottoms',
              image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&auto=format&fit=crop&q=80',
            },
            {
              title: 'BAGS // BALO',
              subtitle: 'Studs & Utility Backpacks',
              href: '/shop?categorySlug=balo-tui-xach',
              image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
            },
            {
              title: 'COLLAB // DC x AB',
              subtitle: 'Special Battle Overprint',
              href: '/shop?collectionSlug=collab-all-blacks',
              image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80',
            },
          ].map((cat) => (
            <Link
              key={cat.title}
              href={cat.href}
              className="group relative aspect-[4/5] overflow-hidden bg-neutral-900 border border-neutral-200"
            >
              <Image
                src={cat.image}
                alt={cat.title}
                fill
                className="object-cover object-center grayscale contrast-125 group-hover:scale-105 group-hover:grayscale-0 transition-all duration-500"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white flex items-end justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider">{cat.title}</h3>
                  <p className="text-[11px] text-neutral-300 font-mono mt-0.5">{cat.subtitle}</p>
                </div>
                <div className="p-2 bg-white text-black rounded-none group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. NEW ARRIVALS INTERACTIVE PRODUCT GRID */}
      <HomeProductsGrid initialProducts={initialProducts} />

      {/* 4. EDITORIAL STREETWEAR STATEMENT */}
      <section className="bg-neutral-100 py-16 px-4 sm:px-6 border-y border-neutral-300">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-[11px] font-black uppercase tracking-[0.3em] text-neutral-500 block mb-3">
            CRAFTSMANSHIP & PHILOSOPHY
          </span>
          <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-black mb-4">
            ĐỊNH NGHĨA PHOM DÁNG ĐƯỜNG PHỐ VIỆT NAM
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 font-mono leading-relaxed max-w-2xl mx-auto">
            Không thỏa hiệp với những chất vải mỏng manh nhanh dão, Neut-Studio sử dụng 100% sợi Cotton chải kỹ định lượng 250-320gsm. Mỗi chi tiết từ đường bo cổ kép, wash màu loang bạc cổ điển đến đinh tán kim loại đều được xử lý thủ công tại xưởng may độc lập.
          </p>
        </div>
      </section>

      {/* 5. JOIN THE MOVEMENT PHONE BANNER */}
      <PhoneSubscribeBanner />
    </div>
  );
}
