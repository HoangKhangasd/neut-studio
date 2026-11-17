'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Star, Upload, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { submitProductReview, uploadReviewImageToMinIO } from '../../lib/api';
import { useAuthStore } from '../../stores/auth-store';

interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productSlug: string;
  productTitle: string;
  onSuccess: () => void;
}

export function WriteReviewModal({
  isOpen,
  onClose,
  productSlug,
  productTitle,
  onSuccess,
}: WriteReviewModalProps) {
  const { token, user } = useAuthStore();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [fitScore, setFitScore] = useState(0); // -1: Tight, 0: True to size, 1: Loose
  const [customerName, setCustomerName] = useState(user?.fullName || '');
  const [heightCm, setHeightCm] = useState<number | ''>(172);
  const [weightKg, setWeightKg] = useState<number | ''>(65);
  const [purchasedSize, setPurchasedSize] = useState('L');
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (!token) {
      setErrorMsg('Vui lòng đăng nhập để tải ảnh đánh giá.');
      e.target.value = '';
      return;
    }

    setUploadingImage(true);
    setErrorMsg('');
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          setErrorMsg('Kích thước ảnh tối đa 5MB');
          continue;
        }
        const url = await uploadReviewImageToMinIO(file, token, 'reviews');
        setImages((prev) => [...prev, url]);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Tải ảnh lên MinIO thất bại, vui lòng thử lại.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setErrorMsg('Vui lòng nhập họ và tên của bạn');
      return;
    }
    if (!comment.trim()) {
      setErrorMsg('Vui lòng viết nhận xét cảm nhận thực tế');
      return;
    }

    if (!token) {
      setErrorMsg('Vui lòng đăng nhập để gửi đánh giá sản phẩm');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      await submitProductReview(
        productSlug,
        {
          customerName: customerName.trim(),
          rating,
          fitScore,
          userHeightCm: heightCm ? Number(heightCm) : undefined,
          userWeightKg: weightKg ? Number(weightKg) : undefined,
          purchasedSize,
          comment: comment.trim(),
          images,
        },
        token,
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi gửi đánh giá');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-xl bg-white text-black border-2 border-black p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        <span className="text-[11px] font-mono font-black uppercase tracking-widest text-neutral-500 block mb-1">
          COMMUNITY FEEDBACK // VERIFIED REVIEW
        </span>
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black mb-1">
          VIẾT ĐÁNH GIÁ SẢN PHẨM
        </h2>
        <p className="text-xs text-neutral-600 font-mono mb-6 line-clamp-1">
          {productTitle}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Rating Stars */}
          <div>
            <label className="block text-xs font-bold uppercase mb-2">
              Đánh giá tổng quan:
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 text-black hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-7 h-7 ${
                      (hoverRating || rating) >= star
                        ? 'fill-black text-black'
                        : 'text-neutral-300'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-mono font-bold ml-2">
                {rating === 5 && 'Tuyệt vời, rất hài lòng'}
                {rating === 4 && 'Hài lòng'}
                {rating === 3 && 'Bình thường'}
                {rating === 2 && 'Chưa ưng ý'}
                {rating === 1 && 'Kém chất lượng'}
              </span>
            </div>
          </div>

          {/* 2. Streetwear Fit Evaluation (Killer Feature) */}
          <div>
            <label className="block text-xs font-bold uppercase mb-1">
              Độ vừa vặn thực tế (Form Fit):
            </label>
            <p className="text-[11px] text-neutral-500 font-mono mb-2">
              Đánh giá độ chuẩn phom dáng so với số đo tiêu chuẩn của bạn
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: -1, label: 'Hơi Chật (Tight)', desc: 'Nên tăng 1 size' },
                { value: 0, label: 'Chuẩn Form (True Size)', desc: 'Vừa vặn đúng mô tả' },
                { value: 1, label: 'Rộng Oversize (Loose)', desc: 'Thoải mái, rộng thụng' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFitScore(opt.value)}
                  className={`p-3 text-left border transition-all ${
                    fitScore === opt.value
                      ? 'border-black bg-black text-white'
                      : 'border-neutral-300 bg-neutral-50 text-neutral-800 hover:border-black'
                  }`}
                >
                  <div className="text-xs font-bold uppercase">{opt.label}</div>
                  <div className="text-[10px] opacity-75 mt-0.5 font-mono">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Customer Body Measurements (Streetwear Fit Helper) */}
          <div className="p-4 bg-neutral-50 border border-neutral-200 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-black block">
              Thông số người mặc (Giúp người mua sau tham khảo):
            </span>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-neutral-600 mb-1">
                  Chiều cao (cm)
                </label>
                <input
                  type="number"
                  placeholder="172"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value ? Number(e.target.value) : '')}
                  className="w-full border border-neutral-300 p-2 text-xs font-mono font-bold bg-white focus:outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-neutral-600 mb-1">
                  Cân nặng (kg)
                </label>
                <input
                  type="number"
                  placeholder="65"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value ? Number(e.target.value) : '')}
                  className="w-full border border-neutral-300 p-2 text-xs font-mono font-bold bg-white focus:outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-neutral-600 mb-1">
                  Size đã mua
                </label>
                <select
                  value={purchasedSize}
                  onChange={(e) => setPurchasedSize(e.target.value)}
                  className="w-full border border-neutral-300 p-2 text-xs font-mono font-bold bg-white focus:outline-none focus:border-black"
                >
                  <option value="S">Size S</option>
                  <option value="M">Size M</option>
                  <option value="L">Size L</option>
                  <option value="XL">Size XL</option>
                  <option value="XXL">Size XXL</option>
                </select>
              </div>
            </div>
          </div>

          {/* 4. Customer Name */}
          <div>
            <label className="block text-xs font-bold uppercase mb-1">
              Họ và tên của bạn: *
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Hoàng Long"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full border border-neutral-300 p-2.5 text-xs font-medium focus:outline-none focus:border-black"
            />
          </div>

          {/* 5. Detailed Comment */}
          <div>
            <label className="block text-xs font-bold uppercase mb-1">
              Nhận xét chi tiết: *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Chia sẻ về chất vải, độ dày dặn, đường may, độ bền hình in hoặc trải nghiệm mặc thực tế..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border border-neutral-300 p-2.5 text-xs font-mono focus:outline-none focus:border-black leading-relaxed"
            />
          </div>

          {/* 6. Photo Feedback Upload to MinIO */}
          <div>
            <label className="block text-xs font-bold uppercase mb-1">
              Ảnh Feedback thực tế (MinIO S3 Storage):
            </label>
            <div className="flex flex-wrap items-center gap-3">
              {images.map((imgUrl, idx) => (
                <div
                  key={idx}
                  className="relative w-16 h-20 border border-black group overflow-hidden bg-neutral-100"
                >
                  <Image
                    src={imgUrl}
                    alt="Review preview"
                    fill
                    className="object-cover object-center"
                    sizes="64px"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Xóa ảnh này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <label className="w-16 h-20 border-2 border-dashed border-neutral-400 hover:border-black flex flex-col items-center justify-center cursor-pointer transition-colors text-neutral-600 hover:text-black">
                {uploadingImage ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-5 h-5 mb-1" />
                    <span className="text-[9px] font-mono uppercase font-bold">Thêm ảnh</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-[10px] text-neutral-400 font-mono mt-1">
              * Ảnh được tải trực tiếp lên MinIO S3 bằng Presigned PUT URL bảo mật cao.
            </p>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-3 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-black hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                ĐANG LƯU ĐÁNH GIÁ...
              </>
            ) : (
              'HOÀN TẤT VÀ GỬI ĐÁNH GIÁ'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
