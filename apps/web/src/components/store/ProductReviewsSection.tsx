'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Star, CheckCircle2, Camera, ThumbsUp, MessageSquarePlus, X } from 'lucide-react';
import { ProductReview, ReviewStats } from '../../lib/types';
import { fetchProductReviews } from '../../lib/api';
import { WriteReviewModal } from './WriteReviewModal';

interface ProductReviewsSectionProps {
  productSlug: string;
  productTitle: string;
}

export function ProductReviewsSection({
  productSlug,
  productTitle,
}: ProductReviewsSectionProps) {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'with_images' | 'verified'>('all');
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const loadReviews = () => {
    setLoading(true);
    fetchProductReviews(productSlug)
      .then((data) => {
        setReviews(data.reviews);
        setStats(data.stats);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReviews();
  }, [productSlug]);

  const filteredReviews = reviews.filter((r) => {
    if (activeFilter === 'with_images') return r.images && r.images.length > 0;
    if (activeFilter === 'verified') return r.isVerifiedPurchase;
    return true;
  });

  return (
    <section className="mt-16 pt-12 border-t-2 border-black max-w-7xl mx-auto px-4 sm:px-6">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-neutral-200 gap-4 mb-8">
        <div>
          <span className="text-[11px] font-mono font-black uppercase tracking-[0.25em] text-neutral-500 block mb-1">
            CUSTOMER REVIEWS & REAL FIT // ĐÁNH GIÁ THỰC TẾ
          </span>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
            ĐÁNH GIÁ TỪ CỘNG ĐỒNG STREETWEAR
          </h2>
        </div>

        <button
          onClick={() => setIsWriteModalOpen(true)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-black hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-widest transition-colors shrink-0"
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span>VIẾT ĐÁNH GIÁ SẢN PHẨM</span>
        </button>
      </div>

      {/* Review Metrics & Streetwear Fit Gauge */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-8 bg-neutral-50 border border-neutral-200 mb-10">
          {/* Average Rating (4 cols) */}
          <div className="lg:col-span-4 flex flex-col justify-center items-center lg:items-start lg:border-r lg:border-neutral-200 pr-6">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-5xl font-black text-black tracking-tight">
                {stats.averageRating.toFixed(1)}
              </span>
              <span className="text-sm font-mono text-neutral-400 font-bold">/ 5.0</span>
            </div>
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-5 h-5 ${
                    s <= Math.round(stats.averageRating)
                      ? 'fill-black text-black'
                      : 'text-neutral-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs font-mono text-neutral-600">
              Dựa trên {stats.totalReviews} đánh giá từ người mua thực tế
            </p>
          </div>

          {/* Real Fit Gauge: Streetwear Fit Breakdown (8 cols) */}
          <div className="lg:col-span-8 flex flex-col justify-center space-y-4">
            <div>
              <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider mb-2">
                <span>THƯỚC ĐO ĐỘ VỪA VẶN THỰC TẾ (REAL FIT GAUGE):</span>
                <span className="font-mono text-neutral-600 font-bold">
                  {stats.fitBreakdown.trueToSizePercent}% ĐÁNH GIÁ CHUẨN FORM
                </span>
              </div>

              {/* Segmented Progress Bar */}
              <div className="w-full h-3 bg-neutral-200 flex overflow-hidden">
                <div
                  style={{ width: `${stats.fitBreakdown.tightPercent}%` }}
                  className="bg-neutral-400 transition-all duration-500"
                  title={`Hơi chật: ${stats.fitBreakdown.tightPercent}%`}
                />
                <div
                  style={{ width: `${stats.fitBreakdown.trueToSizePercent}%` }}
                  className="bg-black transition-all duration-500"
                  title={`Chuẩn form: ${stats.fitBreakdown.trueToSizePercent}%`}
                />
                <div
                  style={{ width: `${stats.fitBreakdown.loosePercent}%` }}
                  className="bg-neutral-600 transition-all duration-500"
                  title={`Rộng oversize: ${stats.fitBreakdown.loosePercent}%`}
                />
              </div>

              {/* Labels */}
              <div className="grid grid-cols-3 text-center text-[11px] font-mono mt-2">
                <div className="text-left text-neutral-600">
                  <span className="font-bold text-black">{stats.fitBreakdown.tightPercent}%</span> Hơi chật
                </div>
                <div className="text-center font-bold text-black">
                  <span>{stats.fitBreakdown.trueToSizePercent}%</span> Chuẩn form
                </div>
                <div className="text-right text-neutral-600">
                  <span className="font-bold text-black">{stats.fitBreakdown.loosePercent}%</span> Rộng oversize
                </div>
              </div>
            </div>

            <p className="text-[11px] text-neutral-500 font-mono">
              💡 Khách hàng đánh giá sản phẩm này mang đúng form Streetwear tiêu chuẩn. Bạn nên chọn đúng size thường mặc hoặc tham khảo số đo người dùng bên dưới.
            </p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-neutral-200 pb-3">
        {[
          { key: 'all', label: `TẤT CẢ (${reviews.length})` },
          { key: 'with_images', label: `CÓ HÌNH ẢNH (${reviews.filter((r) => r.images && r.images.length > 0).length})` },
          { key: 'verified', label: `ĐÃ MUA HÀNG (${reviews.filter((r) => r.isVerifiedPurchase).length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key as any)}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors border ${
              activeFilter === tab.key
                ? 'bg-black text-white border-black'
                : 'bg-white text-neutral-600 border-neutral-300 hover:border-black'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="py-16 text-center font-mono text-xs text-neutral-400 uppercase tracking-widest">
          ĐANG TẢI ĐÁNH GIÁ SẢN PHẨM...
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-neutral-300 p-8 font-mono text-xs text-neutral-500">
          Chưa có đánh giá nào phù hợp với bộ lọc này. Hãy là người đầu tiên đánh giá sản phẩm!
        </div>
      ) : (
        <div className="divide-y divide-neutral-200 space-y-6">
          {filteredReviews.map((review) => {
            const fitLabel =
              review.fitScore < 0
                ? 'Hơi chật'
                : review.fitScore > 0
                ? 'Rộng oversize'
                : 'Chuẩn form';

            return (
              <div key={review.id} className="pt-6 first:pt-0">
                {/* Header: Customer Name, Verified badge, Star Rating */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs uppercase text-black">
                      {review.customerName}
                    </span>
                    {review.isVerifiedPurchase && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ĐÃ MUA HÀNG CHÍNH HÃNG
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] font-mono text-neutral-400">
                    {new Date(review.createdAt).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                {/* Rating & Body Specs Badge (Killer Feature) */}
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= review.rating ? 'fill-black text-black' : 'text-neutral-300'
                        }`}
                      />
                    ))}
                  </div>

                  <span className="text-[11px] font-bold font-mono px-2 py-0.5 bg-neutral-100 border border-neutral-300 text-neutral-800 uppercase">
                    Độ vừa: {fitLabel}
                  </span>

                  {(review.userHeightCm || review.userWeightKg || review.purchasedSize) && (
                    <span className="text-[11px] font-bold font-mono px-2 py-0.5 bg-black text-white uppercase">
                      {review.userHeightCm ? `${review.userHeightCm}cm` : ''}
                      {review.userWeightKg ? ` • ${review.userWeightKg}kg` : ''}
                      {review.purchasedSize ? ` • Size ${review.purchasedSize}` : ''}
                    </span>
                  )}
                </div>

                {/* Comment */}
                <p className="text-xs text-neutral-700 leading-relaxed font-mono mb-4">
                  {review.comment}
                </p>

                {/* Photo feedback thumbnails */}
                {review.images && review.images.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {review.images.map((imgUrl, i) => (
                      <button
                        key={i}
                        onClick={() => setZoomImage(imgUrl)}
                        className="relative w-20 h-24 border border-neutral-300 hover:border-black transition-colors overflow-hidden group bg-neutral-100"
                      >
                        <Image
                          src={imgUrl}
                          alt="Feedback photo"
                          fill
                          className="object-cover object-center group-hover:scale-105 transition-transform"
                          sizes="80px"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Write Review Modal */}
      <WriteReviewModal
        isOpen={isWriteModalOpen}
        onClose={() => setIsWriteModalOpen(false)}
        productSlug={productSlug}
        productTitle={productTitle}
        onSuccess={loadReviews}
      />

      {/* Image Zoom Lightbox Modal */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xs animate-fade-in"
          onClick={() => setZoomImage(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] w-full h-full flex items-center justify-center">
            <Image
              src={zoomImage}
              alt="Feedback zoom"
              fill
              className="object-contain"
            />
            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-2 right-2 p-2 bg-black/80 text-white hover:bg-black transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
