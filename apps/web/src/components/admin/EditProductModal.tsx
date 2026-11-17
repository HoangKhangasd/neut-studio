'use client';

import React, { useState, useEffect } from 'react';
import { X, Upload, Loader2, Check } from 'lucide-react';
import { updateAdminProduct, uploadReviewImageToMinIO } from '../../lib/api';
import { AdminProduct, Category } from '../../lib/types';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: AdminProduct | null;
  categories: Category[];
  token: string;
  onSuccess: () => void;
}

export function EditProductModal({
  isOpen,
  onClose,
  product,
  categories,
  token,
  onSuccess,
}: EditProductModalProps) {
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [basePrice, setBasePrice] = useState(0);
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [images, setImages] = useState<{ previewUrl: string; minioUrl: string }[]>([]);

  // Stock per size
  const [stockS, setStockS] = useState(0);
  const [stockM, setStockM] = useState(0);
  const [stockL, setStockL] = useState(0);
  const [stockXL, setStockXL] = useState(0);

  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sync state when product changes
  useEffect(() => {
    if (product) {
      setTitle(product.title || '');
      setCategoryId(product.categoryId || '');
      setBasePrice(product.basePrice || 0);
      setDescription(product.description || '');
      setIsPublished(product.isPublished ?? true);
      setIsFeatured(product.isFeatured ?? false);
      setImages(product.images?.map((img) => ({ previewUrl: img.imageUrl, minioUrl: img.imageUrl })) || []);

      // Variants stock
      const varS = product.variants?.find((v) => v.size === 'S');
      const varM = product.variants?.find((v) => v.size === 'M');
      const varL = product.variants?.find((v) => v.size === 'L');
      const varXL = product.variants?.find((v) => v.size === 'XL');

      setStockS(varS ? varS.stockQuantity : 0);
      setStockM(varM ? varM.stockQuantity : 0);
      setStockL(varL ? varL.stockQuantity : 0);
      setStockXL(varXL ? varXL.stockQuantity : 0);

      setError('');
      setSuccess('');
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !token) return;
    const file = e.target.files[0];
    const localPreview = URL.createObjectURL(file);
    setIsUploadingImage(true);
    setError('');

    try {
      const publicUrl = await uploadReviewImageToMinIO(file, token, 'products');
      setImages((prev) => [...prev, { previewUrl: localPreview, minioUrl: publicUrl }]);
    } catch (err: any) {
      URL.revokeObjectURL(localPreview);
      setError(err.message || 'Tải ảnh lên MinIO thất bại');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !product) return;

    if (!title.trim()) {
      setError('Vui lòng nhập tên sản phẩm');
      return;
    }

    setIsUpdating(true);
    setError('');
    setSuccess('');

    try {
      const varS = product.variants?.find((v) => v.size === 'S');
      const varM = product.variants?.find((v) => v.size === 'M');
      const varL = product.variants?.find((v) => v.size === 'L');
      const varXL = product.variants?.find((v) => v.size === 'XL');

      const payload = {
        title: title.trim(),
        categoryId: categoryId && categoryId.trim() ? categoryId.trim() : undefined,
        basePrice: Number(basePrice) || 0,
        description: description.trim() || undefined,
        isPublished,
        isFeatured,
        images: images.map((img) => img.minioUrl),
        variants: [
          { id: varS?.id, size: 'S', stockQuantity: Number(stockS) || 0, price: Number(basePrice) },
          { id: varM?.id, size: 'M', stockQuantity: Number(stockM) || 0, price: Number(basePrice) },
          { id: varL?.id, size: 'L', stockQuantity: Number(stockL) || 0, price: Number(basePrice) },
          { id: varXL?.id, size: 'XL', stockQuantity: Number(stockXL) || 0, price: Number(basePrice) },
        ],
      };

      await updateAdminProduct(product.id, payload, token);
      setSuccess('Cập nhật sản phẩm thành công!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 600);
    } catch (err: any) {
      setError(err.message || 'Cập nhật sản phẩm thất bại');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 block">
              Quản Trị Sản Phẩm // ID: {product.id.slice(0, 8)}...
            </span>
            <h2 className="text-lg font-black uppercase text-black">CHỈNH SỬA SẢN PHẨM</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-black hover:bg-neutral-100 border border-neutral-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          {error && (
            <div className="p-3 bg-red-50 border border-red-500 text-red-700 font-bold">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-600 text-green-800 font-bold flex items-center gap-2">
              <Check size={16} />
              <span>{success}</span>
            </div>
          )}

          <div>
            <label className="block font-bold uppercase mb-1">Tên sản phẩm *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-neutral-300 p-2 focus:border-black outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold uppercase mb-1">Danh mục</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full border border-neutral-300 p-2 focus:border-black outline-hidden bg-white"
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase mb-1">Giá bán cơ sở (VND) *</label>
              <input
                type="number"
                required
                step={10000}
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
                className="w-full border border-neutral-300 p-2 focus:border-black outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold uppercase mb-1">Mô tả sản phẩm</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Chất liệu cotton 250gsm, form dáng boxy streetwear..."
              className="w-full border border-neutral-300 p-2 focus:border-black outline-hidden"
            />
          </div>

          {/* Trạng thái hiển thị */}
          <div className="flex items-center gap-6 p-3 bg-neutral-50 border border-neutral-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-4 h-4 accent-black"
              />
              <span className="font-bold uppercase">Công khai sản phẩm (Hiển thị storefront)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 accent-black"
              />
              <span className="font-bold uppercase">Sản phẩm nổi bật (Featured)</span>
            </label>
          </div>

          {/* Stock per size */}
          <div>
            <label className="block font-bold uppercase mb-2">Số lượng tồn kho theo Size</label>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <span className="text-[10px] text-neutral-500 uppercase block">Size S</span>
                <input
                  type="number"
                  min={0}
                  value={stockS}
                  onChange={(e) => setStockS(Number(e.target.value))}
                  className="w-full border border-neutral-300 p-1.5 text-center focus:border-black"
                />
              </div>
              <div>
                <span className="text-[10px] text-neutral-500 uppercase block">Size M</span>
                <input
                  type="number"
                  min={0}
                  value={stockM}
                  onChange={(e) => setStockM(Number(e.target.value))}
                  className="w-full border border-neutral-300 p-1.5 text-center focus:border-black"
                />
              </div>
              <div>
                <span className="text-[10px] text-neutral-500 uppercase block">Size L</span>
                <input
                  type="number"
                  min={0}
                  value={stockL}
                  onChange={(e) => setStockL(Number(e.target.value))}
                  className="w-full border border-neutral-300 p-1.5 text-center focus:border-black"
                />
              </div>
              <div>
                <span className="text-[10px] text-neutral-500 uppercase block">Size XL</span>
                <input
                  type="number"
                  min={0}
                  value={stockXL}
                  onChange={(e) => setStockXL(Number(e.target.value))}
                  className="w-full border border-neutral-300 p-1.5 text-center focus:border-black"
                />
              </div>
            </div>
          </div>

          {/* MinIO Image Upload */}
          <div>
            <label className="block font-bold uppercase mb-1">Hình ảnh sản phẩm (MinIO S3)</label>
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 px-3 py-2 border border-black bg-neutral-50 hover:bg-neutral-100 cursor-pointer">
                <Upload size={14} />
                <span>{isUploadingImage ? 'Đang tải lên MinIO...' : 'Tải thêm ảnh từ máy'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploadingImage}
                  className="hidden"
                />
              </label>
              <span className="text-[10px] text-neutral-500">
                {images.length} ảnh trong bộ sưu tập
              </span>
            </div>

            {images.length > 0 && (
              <div className="flex gap-2 mt-2 overflow-x-auto py-1">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-16 h-16 border border-neutral-300 shrink-0 bg-neutral-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.previewUrl || img.minioUrl}
                      alt="Product preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute top-0 right-0 p-0.5 bg-black text-white text-[10px] hover:bg-red-600 transition-colors cursor-pointer"
                      title="Xóa ảnh này"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-neutral-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-neutral-300 text-xs font-bold uppercase hover:border-black transition-colors"
            >
              HỦY BỎ
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="px-6 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-colors"
            >
              {isUpdating ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>ĐANG LƯU...</span>
                </>
              ) : (
                <span>LƯU THAY ĐỔI</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
