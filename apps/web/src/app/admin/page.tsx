'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  ShieldCheck,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  LogOut,
  RefreshCw,
  Search,
  Loader2,
  Boxes,
  Plus,
  Minus,
  Eye,
  EyeOff,
  Upload,
  X,
  Tag,
  Check,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  loginUser,
  fetchAdminOrders,
  updateAdminOrderStatus,
  fetchAdminProducts,
  updateAdminVariantStock,
  updateAdminProduct,
  createAdminProduct,
  deleteAdminProduct,
  uploadReviewImageToMinIO,
  fetchCategories,
} from '../../lib/api';
import { formatVND } from '../../lib/utils';
import { AdminProduct, Category } from '../../lib/types';
import { EditProductModal } from '../../components/admin/EditProductModal';

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState('admin@neut.studio');
  const [password, setPassword] = useState('admin123');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory'>('orders');

  // Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Inventory / Products State
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [stockUpdatingId, setStockUpdatingId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // New Product Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newBasePrice, setNewBasePrice] = useState(450000);
  const [newDescription, setNewDescription] = useState('');
  const [newImages, setNewImages] = useState<string[]>([]);
  const [newStockS, setNewStockS] = useState(15);
  const [newStockM, setNewStockM] = useState(25);
  const [newStockL, setNewStockL] = useState(25);
  const [newStockXL, setNewStockXL] = useState(10);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  // Check saved token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('neut_admin_token');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  // Fetch data when token is present
  useEffect(() => {
    if (token) {
      loadOrders();
      loadProducts();
      fetchCategories().then((res) => setCategories(res)).catch(() => {});
    }
  }, [token]);

  const loadOrders = async () => {
    if (!token) return;
    setOrdersLoading(true);
    try {
      const data = await fetchAdminOrders(token);
      setOrders(data);
    } catch {
      handleLogout();
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadProducts = async () => {
    if (!token) return;
    setProductsLoading(true);
    try {
      const data = await fetchAdminProducts(token);
      setProducts(data);
    } catch {
      // Ignore
    } finally {
      setProductsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await loginUser({ email, password });
      setToken(res.accessToken);
      localStorage.setItem('neut_admin_token', res.accessToken);
    } catch (err: any) {
      setLoginError(err.message || 'Email hoặc mật khẩu không chính xác');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('neut_admin_token');
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    if (!token) return;
    try {
      await updateAdminOrderStatus(orderId, newStatus, token);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, orderStatus: newStatus } : o)),
      );
    } catch (err: any) {
      alert(err.message || 'Cập nhật trạng thái thất bại');
    }
  };

  // Update variant stock quantity
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

  // Toggle publish status
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

  // Delete product
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

  // Image Upload to MinIO
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploadingImage(true);

    try {
      const publicUrl = await uploadReviewImageToMinIO(file);
      setNewImages((prev) => [...prev, publicUrl]);
    } catch (err: any) {
      alert(err.message || 'Tải ảnh lên MinIO thất bại');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Create Product Submit
  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setCreateError('');
    setCreateSuccess('');

    if (!newTitle.trim()) {
      setCreateError('Vui lòng nhập tên sản phẩm');
      return;
    }

    setIsCreatingProduct(true);
    try {
      const payload = {
        title: newTitle.trim(),
        categoryId: newCategoryId && newCategoryId.trim() ? newCategoryId.trim() : undefined,
        basePrice: Number(newBasePrice) || 450000,
        description: newDescription.trim() || undefined,
        images:
          newImages.length > 0
            ? newImages
            : ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800'],
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

  // If not logged in, render login form
  if (!token) {
    return (
      <div className="max-w-md mx-auto py-24 px-4">
        <div className="border-2 border-black p-8 bg-white shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-black" />
            <span className="text-[11px] font-mono font-black uppercase tracking-widest text-neutral-500">
              Admin CMS // Xác Thực Quản Trị
            </span>
          </div>
          <h1 className="text-2xl font-black uppercase text-black tracking-tight mb-6">
            ĐĂNG NHẬP HỆ THỐNG
          </h1>

          {loginError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-500 text-red-700 text-xs font-mono">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-neutral-300 p-2 text-xs font-mono focus:border-black focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
                Mật Khẩu
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-neutral-300 p-2 text-xs font-mono focus:border-black focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {loginLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                'Vào Bảng Điều Khiển'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerPhone.includes(searchTerm);
    const matchesStatus = statusFilter === 'ALL' || o.orderStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter products
  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.slug.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b-2 border-black gap-4 mb-6">
        <div>
          <span className="text-[11px] font-mono font-black uppercase tracking-widest text-neutral-500 block">
            Neut-Studio Management Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase text-black tracking-tight">
            QUẢN TRỊ NỘI DUNG & VẬN HÀNH
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (activeTab === 'orders') loadOrders();
              else loadProducts();
            }}
            className="flex items-center gap-1.5 px-3 py-2 border border-black text-xs font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Làm Mới</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-red-700 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng Xuất</span>
          </button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex border-b-2 border-black mb-6">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-black text-white'
              : 'bg-white text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <Package size={16} />
          <span>[1] Quản Lý Đơn Hàng ({orders.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer ${
            activeTab === 'inventory'
              ? 'bg-black text-white'
              : 'bg-white text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <Boxes size={16} />
          <span>[2] Kho Hàng & Biến Thể ({products.length})</span>
        </button>
      </div>

      {/* ===================== TAB 1: ORDERS ===================== */}
      {activeTab === 'orders' && (
        <div>
          {/* Status Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 font-mono">
            <div className="p-4 border border-neutral-300 bg-neutral-50">
              <span className="text-[11px] font-bold text-neutral-500 uppercase block mb-1">
                Tổng Số Đơn
              </span>
              <div className="text-2xl font-black text-black">{orders.length}</div>
            </div>

            <div className="p-4 border border-neutral-300 bg-neutral-50">
              <div className="flex items-center justify-between text-amber-600 mb-1">
                <span className="text-[11px] font-bold uppercase">Chờ Xử Lý</span>
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-amber-600">
                {orders.filter((o) => o.orderStatus === 'PENDING').length}
              </div>
            </div>

            <div className="p-4 border border-neutral-300 bg-neutral-50">
              <div className="flex items-center justify-between text-blue-600 mb-1">
                <span className="text-[11px] font-bold uppercase">Đang Giao Vận</span>
                <Truck className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-blue-600">
                {orders.filter((o) => o.orderStatus === 'SHIPPING').length}
              </div>
            </div>

            <div className="p-4 border border-neutral-300 bg-neutral-50">
              <div className="flex items-center justify-between text-emerald-700 mb-1">
                <span className="text-[11px] font-bold uppercase">Đã Hoàn Tất</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-emerald-700">
                {orders.filter((o) => o.orderStatus === 'COMPLETED').length}
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="TÌM THEO MÃ ĐƠN, TÊN KHÁCH HÀNG HOẶC SỐ ĐIỆN THOẠI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-neutral-300 pl-9 pr-4 py-2 text-xs font-mono font-medium focus:outline-hidden focus:border-black uppercase"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              {['ALL', 'PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-2 text-xs font-bold uppercase whitespace-nowrap transition-colors border cursor-pointer ${
                    statusFilter === st
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-neutral-700 border-neutral-300 hover:border-black'
                  }`}
                >
                  {st === 'ALL' ? 'TẤT CẢ' : st}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Table */}
          {ordersLoading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-black mb-2" />
              <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">
                Đang tải dữ liệu đơn hàng...
              </span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-neutral-300 p-8 font-mono text-xs text-neutral-500">
              Không tìm thấy đơn hàng nào phù hợp.
            </div>
          ) : (
            <div className="border border-neutral-300 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-black text-white font-mono uppercase text-[11px] tracking-wider">
                    <th className="p-3">Mã Đơn</th>
                    <th className="p-3">Khách Hàng</th>
                    <th className="p-3">Địa Chỉ Giao</th>
                    <th className="p-3">Tổng Tiền</th>
                    <th className="p-3">Phương Thức</th>
                    <th className="p-3">Trạng Thái</th>
                    <th className="p-3 text-right">Cập Nhật</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredOrders.map((order) => {
                    const statusStyles: any = {
                      PENDING: 'bg-amber-100 text-amber-900 border-amber-300',
                      CONFIRMED: 'bg-blue-100 text-blue-900 border-blue-300',
                      SHIPPING: 'bg-indigo-100 text-indigo-900 border-indigo-300',
                      COMPLETED: 'bg-emerald-100 text-emerald-900 border-emerald-300',
                      CANCELLED: 'bg-red-100 text-red-900 border-red-300',
                    };

                    return (
                      <tr key={order.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="p-3 font-mono font-bold text-black whitespace-nowrap">
                          {order.orderCode}
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-black">{order.customerName}</div>
                          <div className="font-mono text-neutral-500 text-[11px]">
                            {order.customerPhone}
                          </div>
                        </td>
                        <td className="p-3 max-w-xs truncate text-neutral-700">
                          {order.shippingAddress?.street}, {order.shippingAddress?.district},{' '}
                          {order.shippingAddress?.province}
                        </td>
                        <td className="p-3 font-mono font-bold text-black whitespace-nowrap">
                          {formatVND(order.totalAmount)}
                        </td>
                        <td className="p-3 font-mono text-neutral-600 whitespace-nowrap">
                          {order.paymentMethod}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 text-[10px] font-mono font-bold uppercase border ${
                              statusStyles[order.orderStatus] || 'bg-neutral-100 text-neutral-800'
                            }`}
                          >
                            {order.orderStatus}
                          </span>
                        </td>
                        <td className="p-3 text-right whitespace-nowrap">
                          <select
                            value={order.orderStatus}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className="text-xs font-mono font-bold uppercase p-1.5 border border-neutral-300 bg-white focus:outline-hidden focus:border-black cursor-pointer"
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="CONFIRMED">CONFIRMED</option>
                            <option value="SHIPPING">SHIPPING</option>
                            <option value="COMPLETED">COMPLETED</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB 2: INVENTORY & PRODUCTS ===================== */}
      {activeTab === 'inventory' && (
        <div>
          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="TÌM SẢN PHẨM HOẶC SLUG..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full border border-neutral-300 pl-9 pr-4 py-2 text-xs font-mono focus:outline-hidden focus:border-black uppercase"
              />
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Plus size={16} />
              <span>THÊM SẢN PHẨM MỚI</span>
            </button>
          </div>

          {/* Products & Variants List */}
          {productsLoading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-black mb-2" />
              <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">
                Đang tải danh sách kho sản phẩm...
              </span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-neutral-300 p-8 font-mono text-xs text-neutral-500">
              Không tìm thấy sản phẩm nào.
            </div>
          ) : (
            <div className="space-y-4">
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
                            <h3 className="text-sm font-black uppercase text-black">
                              {prod.title}
                            </h3>
                            <span className="text-[10px] font-mono px-2 py-0.5 bg-neutral-100 border border-neutral-300 text-neutral-700">
                              {prod.category?.name || 'Tất cả'}
                            </span>
                          </div>
                          <p className="text-[11px] font-mono text-neutral-500">
                            Slug: {prod.slug} • Giá cơ sở: {formatVND(prod.basePrice)} • Tổng tồn: <strong>{totalStock}</strong> cái
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
                              <span className="font-bold text-black">
                                Size {v.size}
                              </span>
                              <span className="text-[10px] text-neutral-500">
                                {v.colorName}
                              </span>
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
                                className="p-1 hover:bg-neutral-200 disabled:opacity-30 cursor-pointer"
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

          {/* ===================== ADD PRODUCT MODAL ===================== */}
          {isAddModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="fixed inset-0 bg-black/70 backdrop-blur-xs"
                onClick={() => setIsAddModalOpen(false)}
              />
              <div className="relative w-full max-w-xl bg-white border-2 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-10 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-4">
                  <h2 className="text-base font-black uppercase text-black">
                    THÊM SẢN PHẨM MỚI VÀO KHO
                  </h2>
                  <button
                    onClick={() => setIsAddModalOpen(false)}
                    className="p-1 text-black hover:bg-black hover:text-white transition-colors cursor-pointer"
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
                    <label className="block font-bold uppercase mb-1">Hình ảnh sản phẩm (MinIO S3)</label>
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
                          <div key={idx} className="relative w-16 h-16 border border-neutral-300 shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img} alt="Product preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setNewImages((prev) => prev.filter((_, i) => i !== idx))}
                              className="absolute top-0 right-0 p-0.5 bg-black text-white text-[10px]"
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
      )}
    </div>
  );
}
