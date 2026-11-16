'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Boxes,
  Plus,
  Minus,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Upload,
  Search,
  RefreshCw,
  Loader2,
  X,
  Check,
} from 'lucide-react';
import {
  fetchAdminProducts,
  fetchCategories,
  updateAdminProduct,
  updateAdminVariantStock,
  createAdminProduct,
  deleteAdminProduct,
  uploadReviewImageToMinIO,
} from '../../../lib/api';
import { formatVND } from '../../../lib/utils';
import { AdminProduct, Category } from '../../../lib/types';
import { EditProductModal } from '../../../components/admin/EditProductModal';

export default function AdminProductsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Modals & Action States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [stockUpdatingId, setStockUpdatingId] = useState<string | null>(null);

  // New Product Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newBasePrice, setNewBasePrice] = useState<number>(450000);
  const [newDescription, setNewDescription] = useState('');
  const [newImages, setNewImages] = useState<{ previewUrl: string; minioUrl: string }[]>([]);
  const [newStockS, setNewStockS] = useState(15);
  const [newStockM, setNewStockM] = useState(25);
  const [newStockL, setNewStockL] = useState(25);
  const [newStockXL, setNewStockXL] = useState(10);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  useEffect(() => {
    const savedToken = localStorage.getItem('neut_admin_token');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  useEffect(() => {
    if (token) {
      loadProducts();
      fetchCategories().then(setCategories).catch(() => {});
    }
  }, [token]);

  const loadProducts = async () => {
    if (!token) return;
    setLoading(true);
    setErrorMessage('');

    try {
      const data = await fetchAdminProducts(token);
      setProducts(data);
    } catch (err: any) {
      if (err.status === 401 || err.status === 403) {
        localStorage.removeItem('neut_admin_token');
        window.location.reload();
      } else {
        setErrorMessage(err.message || 'Không thể tải danh sách sản phẩm');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (productId: string, currentStatus: boolean) => {
    if (!token) return;
    try {
      await updateAdminProduct(productId, { isPublished: !currentStatus }, token);
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, isPublished: !currentStatus } : p)),
      );
    } catch (err: any) {
      alert(err.message || 'Cập nhật trạng thái sản phẩm thất bại');
    }
  };

  const handleDeleteProduct = async (productId: string, productTitle: string) => {
    if (!token) return;
    const confirmed = window.confirm(
      `Xác nhận xóa sản phẩm: "${productTitle}"?\n\nSản phẩm sẽ bị gỡ khỏi toàn bộ hệ thống và cửa hàng.`,
    );
    if (!confirmed) return;

    setDeletingId(productId);
    try {
      await deleteAdminProduct(productId, token);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (err: any) {
      alert(err.message || 'Xóa sản phẩm thất bại');
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdateStock = async (productId: string, variantId: string, delta: number) => {
    if (!token) return;
    setStockUpdatingId(variantId);

    const targetProd = products.find((p) => p.id === productId);
    const targetVar = targetProd?.variants.find((v) => v.id === variantId);
    if (!targetVar) return;

    const newStock = Math.max(0, targetVar.stockQuantity + delta);

    try {
      await updateAdminVariantStock(variantId, { stockQuantity: newStock }, token);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? {
                ...p,
                variants: p.variants.map((v) =>
                  v.id === variantId ? { ...v, stockQuantity: newStock } : v,
                ),
              }
            : p,
        ),
      );
    } catch (err: any) {
      alert(err.message || 'Cập nhật số lượng kho thất bại');
    } finally {
      setTimeout(() => setStockUpdatingId(null), 300);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const localPreview = URL.createObjectURL(file);
    setIsUploadingImage(true);
    setCreateError('');

    try {
      const publicUrl = await uploadReviewImageToMinIO(file);
      setNewImages((prev) => [...prev, { previewUrl: localPreview, minioUrl: publicUrl }]);
    } catch (err: any) {
      URL.revokeObjectURL(localPreview);
      setCreateError(err.message || 'Tải ảnh lên MinIO thất bại');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setCreateError('');
    setCreateSuccess('');

    if (!newTitle.trim()) {
      setCreateError('Vui lòng nhập tên sản phẩm');
      return;
    }

    if (newImages.length === 0) {
      setCreateError('Vui lòng tải lên ít nhất 1 hình ảnh sản phẩm vào MinIO');
      return;
    }

    setIsCreatingProduct(true);
    try {
      const payload = {
        title: newTitle.trim(),
        categoryId: newCategoryId && newCategoryId.trim() ? newCategoryId.trim() : undefined,
        basePrice: Number(newBasePrice) || 0,
        description: newDescription.trim() || undefined,
        images: newImages.map((img) => img.minioUrl),
        variants: [
          { size: 'S', colorName: 'Đen', colorHex: '#000000', stockQuantity: Number(newStockS) || 0, price: Number(newBasePrice) },
          { size: 'M', colorName: 'Đen', colorHex: '#000000', stockQuantity: Number(newStockM) || 0, price: Number(newBasePrice) },
          { size: 'L', colorName: 'Đen', colorHex: '#000000', stockQuantity: Number(newStockL) || 0, price: Number(newBasePrice) },
          { size: 'XL', colorName: 'Đen', colorHex: '#000000', stockQuantity: Number(newStockXL) || 0, price: Number(newBasePrice) },
        ],
      };

      await createAdminProduct(payload, token);
      setCreateSuccess('Thêm sản phẩm thành công!');
      setTimeout(() => {
        setIsAddModalOpen(false);
        setNewTitle('');
        setNewDescription('');
        setNewImages([]);
        setCreateSuccess('');
        loadProducts();
      }, 700);
    } catch (err: any) {
      setCreateError(err.message || 'Tạo sản phẩm thất bại');
    } finally {
      setIsCreatingProduct(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-black">
        <div>
          <h1 className="text-xl font-black uppercase text-black tracking-tight">
            QUẢN LÝ KHO SẢN PHẨM
          </h1>
          <p className="text-xs font-mono text-neutral-500">
            Hiện có: <strong>{products.length}</strong> sản phẩm trong danh mục
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white hover:bg-neutral-800 text-xs font-mono font-bold uppercase tracking-wider cursor-pointer"
          >
            <Plus size={14} />
            <span>Thêm Sản Phẩm Mới</span>
          </button>

          <button
            onClick={loadProducts}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 border border-black bg-white hover:bg-neutral-100 text-xs font-mono font-bold uppercase cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Làm Mới</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-500 text-red-700 text-xs font-mono font-bold">
          {errorMessage}
        </div>
      )}

      {/* Search Input */}
      <div className="max-w-md">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên sản phẩm hoặc slug..."
            className="w-full border border-neutral-300 p-2 pl-8 text-xs font-mono focus:border-black outline-hidden bg-white"
          />
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-3" />
        </div>
      </div>

      {/* Products List */}
      {loading ? (
        <div className="p-12 text-center text-xs font-mono text-neutral-500 border-2 border-black bg-white">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-black" />
          <span>ĐANG TẢI DANH SÁCH SẢN PHẨM...</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-12 text-center text-xs font-mono text-neutral-500 border-2 border-black bg-white">
          KHÔNG TÌM THẤY SẢN PHẨM NÀO
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredProducts.map((prod) => {
            const coverImg =
              prod.images?.[0]?.imageUrl ||
              'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800';
            const totalStock = prod.variants.reduce((sum, v) => sum + v.stockQuantity, 0);

            return (
              <div
                key={prod.id}
                className="border-2 border-black bg-white p-4 sm:p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-neutral-200 gap-4 mb-4">
                  {/* Product details */}
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 bg-neutral-100 border border-neutral-300 shrink-0 overflow-hidden">
                      <Image
                        src={coverImg}
                        alt={prod.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-black uppercase text-black">{prod.title}</h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-neutral-100 border border-neutral-300 text-neutral-700">
                          {prod.category?.name || 'Tất cả'}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-neutral-500">
                        Slug: {prod.slug} • Giá cơ sở: {formatVND(prod.basePrice)} • Tổng tồn:{' '}
                        <strong>{totalStock}</strong> cái
                      </p>
                    </div>
                  </div>

                  {/* Actions: Publish toggle, Edit, Delete */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleTogglePublish(prod.id, prod.isPublished)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase border transition-colors cursor-pointer ${
                        prod.isPublished
                          ? 'bg-green-100 text-green-900 border-green-400 hover:bg-green-200'
                          : 'bg-neutral-100 text-neutral-500 border-neutral-300 hover:bg-neutral-200'
                      }`}
                    >
                      {prod.isPublished ? (
                        <>
                          <Eye size={14} />
                          <span>Công khai</span>
                        </>
                      ) : (
                        <>
                          <EyeOff size={14} />
                          <span>Đang ẩn</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setEditingProduct(prod)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase border border-black bg-white hover:bg-black hover:text-white transition-colors cursor-pointer shadow-xs"
                      title="Chỉnh sửa sản phẩm"
                    >
                      <Pencil size={13} />
                      <span>Sửa</span>
                    </button>

                    <button
                      onClick={() => handleDeleteProduct(prod.id, prod.title)}
                      disabled={deletingId === prod.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase border border-red-500 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                      title="Xóa sản phẩm"
                    >
                      {deletingId === prod.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>

                {/* Variants stock grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {prod.variants.map((v) => {
                    const isUpdating = stockUpdatingId === v.id;
                    const isLowStock = v.stockQuantity < 5;
                    const isOutOfStock = v.stockQuantity === 0;

                    return (
                      <div
                        key={v.id}
                        className={`p-2.5 border text-xs font-mono transition-colors ${
                          isOutOfStock
                            ? 'bg-red-50 border-red-300'
                            : isLowStock
                            ? 'bg-amber-50 border-amber-300'
                            : 'bg-neutral-50 border-neutral-300'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-black">Size {v.size}</span>
                          <span className="text-[10px] text-neutral-500">{v.colorName}</span>
                        </div>

                        <div className="text-[10px] text-neutral-600 mb-2">
                          {formatVND(v.salePrice || v.price)}
                        </div>

                        {/* Inline Stock Counter */}
                        <div className="flex items-center justify-between border border-neutral-300 bg-white">
                          <button
                            onClick={() => handleUpdateStock(prod.id, v.id, -1)}
                            disabled={isUpdating || v.stockQuantity <= 0}
                            className="p-1 hover:bg-neutral-200 disabled:opacity-30 cursor-pointer"
                            title="Giảm 1"
                          >
                            <Minus size={12} />
                          </button>
                          <span
                            className={`font-black text-xs px-2 ${
                              isUpdating ? 'animate-pulse text-neutral-400' : 'text-black'
                            }`}
                          >
                            {v.stockQuantity}
                          </span>
                          <button
                            onClick={() => handleUpdateStock(prod.id, v.id, 1)}
                            disabled={isUpdating}
                            className="p-1 hover:bg-neutral-200 cursor-pointer"
                            title="Tăng 1"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add Product */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-4">
              <h2 className="text-lg font-black uppercase text-black">
                THÊM SẢN PHẨM MỚI VÀO KHO
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-black hover:bg-neutral-100 border border-neutral-300 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProductSubmit} className="space-y-4 text-xs font-mono">
              {createError && (
                <div className="p-3 bg-red-50 border border-red-500 text-red-700 font-bold">
                  {createError}
                </div>
              )}

              {createSuccess && (
                <div className="p-3 bg-green-50 border border-green-600 text-green-800 font-bold">
                  {createSuccess}
                </div>
              )}

              <div>
                <label className="block font-bold uppercase mb-1">Tên sản phẩm *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Áo Thun Heavyweight Boxy Fit..."
                  className="w-full border border-neutral-300 p-2 focus:border-black outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase mb-1">Danh mục</label>
                  <select
                    value={newCategoryId}
                    onChange={(e) => setNewCategoryId(e.target.value)}
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
                    value={newBasePrice}
                    onChange={(e) => setNewBasePrice(Number(e.target.value))}
                    className="w-full border border-neutral-300 p-2 focus:border-black outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase mb-1">Mô tả sản phẩm</label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Chất liệu cotton 250gsm, form dáng boxy streetwear..."
                  className="w-full border border-neutral-300 p-2 focus:border-black outline-hidden"
                />
              </div>

              {/* Stock per size */}
              <div>
                <label className="block font-bold uppercase mb-2">Số lượng tồn kho khởi tạo</label>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase block">Size S</span>
                    <input
                      type="number"
                      value={newStockS}
                      onChange={(e) => setNewStockS(Number(e.target.value))}
                      className="w-full border border-neutral-300 p-1.5 text-center focus:border-black"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase block">Size M</span>
                    <input
                      type="number"
                      value={newStockM}
                      onChange={(e) => setNewStockM(Number(e.target.value))}
                      className="w-full border border-neutral-300 p-1.5 text-center focus:border-black"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase block">Size L</span>
                    <input
                      type="number"
                      value={newStockL}
                      onChange={(e) => setNewStockL(Number(e.target.value))}
                      className="w-full border border-neutral-300 p-1.5 text-center focus:border-black"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase block">Size XL</span>
                    <input
                      type="number"
                      value={newStockXL}
                      onChange={(e) => setNewStockXL(Number(e.target.value))}
                      className="w-full border border-neutral-300 p-1.5 text-center focus:border-black"
                    />
                  </div>
                </div>
              </div>

              {/* MinIO Image Upload */}
              <div>
                <label className="block font-bold uppercase mb-1">
                  Hình ảnh sản phẩm (MinIO S3) *
                </label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 px-3 py-2 border border-black bg-neutral-50 hover:bg-neutral-100 cursor-pointer">
                    <Upload size={14} />
                    <span>{isUploadingImage ? 'Đang tải lên MinIO...' : 'Tải ảnh từ máy'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploadingImage}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[10px] text-neutral-500">
                    {newImages.length} ảnh đã chọn
                  </span>
                </div>

                {newImages.length > 0 && (
                  <div className="flex gap-2 mt-2 overflow-x-auto py-1">
                    {newImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative w-16 h-16 border border-neutral-300 shrink-0 bg-neutral-100"
                      >
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
                          onClick={() => setNewImages((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-0 right-0 p-0.5 bg-black text-white text-[10px] hover:bg-red-600 cursor-pointer"
                          title="Xóa ảnh"
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
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 text-xs font-bold uppercase hover:border-black"
                >
                  HỦY BỎ
                </button>
                <button
                  type="submit"
                  disabled={isCreatingProduct}
                  className="px-6 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isCreatingProduct ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <span>LƯU SẢN PHẨM</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Product */}
      <EditProductModal
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        product={editingProduct}
        categories={categories}
        token={token || ''}
        onSuccess={loadProducts}
      />
    </div>
  );
}
