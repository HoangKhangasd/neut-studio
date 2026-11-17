'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  RefreshCw,
  Loader2,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  Eye,
  X,
  AlertTriangle,
} from 'lucide-react';
import { fetchAdminOrders, updateAdminOrderStatus } from '../../../lib/api';
import { formatVND } from '../../../lib/utils';
import {
  AdminPagination,
  DEFAULT_ADMIN_PAGE_SIZE,
} from '../../../components/admin/AdminPagination';

export default function AdminOrdersPage() {
  const [token, setToken] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_ADMIN_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Status updating state
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const ALLOWED_NEXT_STATUSES: Record<string, string[]> = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['SHIPPING', 'CANCELLED'],
    SHIPPING: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('neut_admin_token');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  useEffect(() => {
    if (token) {
      loadOrders();
    }
  }, [token, statusFilter, page, limit, appliedSearch]);

  const loadOrders = async () => {
    if (!token) return;
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetchAdminOrders(token, {
        page,
        limit,
        status: statusFilter,
        search: appliedSearch,
      });

      const nextTotalPages = res.totalPages || 0;
      if (nextTotalPages > 0 && page > nextTotalPages) {
        setPage(nextTotalPages);
        return;
      }

      setOrders(res.data || []);
      setTotalCount(res.total || 0);
      setTotalPages(Math.max(1, nextTotalPages));
    } catch (err: any) {
      if (err.status === 401 || err.status === 403) {
        localStorage.removeItem('neut_admin_token');
        window.location.reload();
      } else {
        setErrorMessage(err.message || 'Không thể tải danh sách đơn hàng');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextSearch = searchTerm.trim();
    if (nextSearch === appliedSearch && page === 1) {
      loadOrders();
      return;
    }
    setAppliedSearch(nextSearch);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    if (appliedSearch !== '' || page !== 1) {
      setAppliedSearch('');
      setPage(1);
    }
  };

  const handleStatusChange = async (orderId: string, currentStatus: string, newStatus: string) => {
    if (!token) return;

    if (newStatus === 'CANCELLED') {
      const confirmed = window.confirm(
        'CẢNH BÁO: Khi hủy đơn hàng, toàn bộ số lượng sản phẩm trong đơn sẽ tự động được hoàn trả vào kho hàng.\n\nBạn có chắc chắn muốn hủy đơn hàng này không?',
      );
      if (!confirmed) return;
    }

    setUpdatingId(orderId);
    setErrorMessage('');

    try {
      await updateAdminOrderStatus(orderId, newStatus, token);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, orderStatus: newStatus } : o)),
      );
    } catch (err: any) {
      if (err.status === 401 || err.status === 403) {
        localStorage.removeItem('neut_admin_token');
        window.location.reload();
      } else {
        alert(err.message || 'Cập nhật trạng thái thất bại');
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-50 border border-amber-300 text-amber-800 text-[10px] font-mono font-bold uppercase">
            <Clock size={11} /> Chờ xử lý
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-50 border border-blue-300 text-blue-800 text-[10px] font-mono font-bold uppercase">
            <CheckCircle2 size={11} /> Đã xác nhận
          </span>
        );
      case 'SHIPPING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-purple-50 border border-purple-300 text-purple-800 text-[10px] font-mono font-bold uppercase">
            <Truck size={11} /> Đang giao hàng
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-green-50 border border-green-300 text-green-800 text-[10px] font-mono font-bold uppercase">
            <CheckCircle2 size={11} /> Hoàn thành
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-red-50 border border-red-300 text-red-800 text-[10px] font-mono font-bold uppercase">
            <XCircle size={11} /> Đã hủy (Hoàn kho)
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-black">
        <div>
          <h1 className="text-xl font-black uppercase text-black tracking-tight">
            QUẢN LÝ ĐƠN HÀNG
          </h1>
          <p className="text-xs font-mono text-neutral-500">
            Tổng cộng: <strong>{totalCount}</strong> đơn hàng trong hệ thống
          </p>
        </div>

        <button
          onClick={loadOrders}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 border border-black bg-white hover:bg-neutral-100 text-xs font-mono font-bold uppercase cursor-pointer"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Làm mới</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-500 text-red-700 text-xs font-mono font-bold">
          {errorMessage}
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        {/* Filter buttons */}
        <div className="flex flex-wrap gap-1.5 text-xs font-mono">
          {[
            { key: 'ALL', label: 'TẤT CẢ' },
            { key: 'PENDING', label: 'CHỜ XỬ LÝ' },
            { key: 'CONFIRMED', label: 'ĐÃ XÁC NHẬN' },
            { key: 'SHIPPING', label: 'ĐANG GIAO' },
            { key: 'COMPLETED', label: 'HOÀN THÀNH' },
            { key: 'CANCELLED', label: 'ĐÃ HỦY' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setStatusFilter(tab.key);
                setPage(1);
              }}
              className={`px-3 py-1.5 font-bold uppercase transition-colors cursor-pointer border ${
                statusFilter === tab.key
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-neutral-600 border-neutral-300 hover:border-black'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search form */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full lg:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Mã đơn, tên, số điện thoại..."
            className="flex-1 border border-neutral-300 p-2 text-xs font-mono focus:border-black outline-hidden bg-white"
          />
          {(searchTerm || appliedSearch) && (
            <button
              type="button"
              onClick={handleClearSearch}
              title="Xóa từ khóa tìm kiếm"
              className="px-2.5 py-2 border border-neutral-300 bg-white text-neutral-600 hover:border-black hover:text-black cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
          <button
            type="submit"
            className="px-3 py-2 bg-black text-white hover:bg-neutral-800 cursor-pointer"
          >
            <Search size={14} />
          </button>
        </form>
      </div>

      {/* Orders Table */}
      <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-neutral-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-black" />
            <span>ĐANG TẢI DANH SÁCH ĐƠN HÀNG...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-neutral-500">
            KHÔNG TÌM THẤY ĐƠN HÀNG NÀO PHÙ HỢP
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-neutral-100 border-b border-black text-neutral-700 uppercase">
                <tr>
                  <th className="p-3">Mã Đơn</th>
                  <th className="p-3">Khách Hàng</th>
                  <th className="p-3">Địa Chỉ Giao</th>
                  <th className="p-3 text-right">Tổng Tiền</th>
                  <th className="p-3">Trạng Thái</th>
                  <th className="p-3">Đổi Trạng Thái</th>
                  <th className="p-3 text-center">Chi Tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {orders.map((order) => {
                  const allowedNext = ALLOWED_NEXT_STATUSES[order.orderStatus] || [];
                  const isUpdating = updatingId === order.id;

                  return (
                    <tr key={order.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="p-3 font-bold text-black">{order.orderCode}</td>
                      <td className="p-3">
                        <p className="font-bold text-black">{order.customerName}</p>
                        <p className="text-[11px] text-neutral-500">{order.customerPhone}</p>
                      </td>
                      <td className="p-3 max-w-[200px] truncate text-[11px] text-neutral-600">
                        {typeof order.shippingAddress === 'object'
                          ? `${order.shippingAddress.street || ''}, ${order.shippingAddress.ward || ''}, ${order.shippingAddress.district || ''}, ${order.shippingAddress.province || ''}`
                          : String(order.shippingAddress)}
                      </td>
                      <td className="p-3 text-right font-black text-black">
                        {formatVND(order.totalAmount)}
                      </td>
                      <td className="p-3">{getStatusBadge(order.orderStatus)}</td>
                      <td className="p-3">
                        {allowedNext.length > 0 ? (
                          <select
                            disabled={isUpdating}
                            value={order.orderStatus}
                            onChange={(e) =>
                              handleStatusChange(order.id, order.orderStatus, e.target.value)
                            }
                            className="border border-neutral-300 p-1 text-[11px] font-mono bg-white focus:border-black outline-hidden cursor-pointer"
                          >
                            <option value={order.orderStatus} disabled>
                              -- Chuyển tiếp --
                            </option>
                            {allowedNext.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-[10px] text-neutral-400">Kết thúc</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setSelectedOrderForDetail(order)}
                          className="p-1 text-neutral-700 hover:text-black hover:bg-neutral-200 border border-neutral-300 transition-colors cursor-pointer"
                          title="Xem chi tiết đơn hàng"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <AdminPagination
          page={page}
          totalPages={totalPages}
          total={totalCount}
          limit={limit}
          currentCount={orders.length}
          disabled={loading}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      </div>

      {/* Order Detail Modal */}
      {selectedOrderForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 block">
                  Chi Tiết Đơn Hàng
                </span>
                <h2 className="text-lg font-black uppercase text-black">
                  {selectedOrderForDetail.orderCode}
                </h2>
              </div>
              <button
                onClick={() => setSelectedOrderForDetail(null)}
                className="p-1 text-black hover:bg-neutral-100 border border-neutral-300 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-neutral-50 border border-neutral-200">
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase">Khách Hàng:</span>
                  <p className="font-bold text-black">{selectedOrderForDetail.customerName}</p>
                  <p>{selectedOrderForDetail.customerPhone}</p>
                  <p>{selectedOrderForDetail.customerEmail}</p>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase">Thanh Toán:</span>
                  <p className="font-bold text-black">{selectedOrderForDetail.paymentMethod}</p>
                  <span className="text-neutral-500 block text-[10px] uppercase mt-2">
                    Trạng Thái Đơn:
                  </span>
                  <div>{getStatusBadge(selectedOrderForDetail.orderStatus)}</div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="p-3 bg-neutral-50 border border-neutral-200">
                <span className="text-neutral-500 block text-[10px] uppercase mb-1">
                  Địa Chỉ Giao Hàng:
                </span>
                <p className="font-bold text-black">
                  {typeof selectedOrderForDetail.shippingAddress === 'object'
                    ? `${selectedOrderForDetail.shippingAddress.street || ''}, ${selectedOrderForDetail.shippingAddress.ward || ''}, ${selectedOrderForDetail.shippingAddress.district || ''}, ${selectedOrderForDetail.shippingAddress.province || ''}`
                    : String(selectedOrderForDetail.shippingAddress)}
                </p>
              </div>

              {/* Items List */}
              <div>
                <h4 className="font-bold uppercase mb-2">Danh Sách Sản Phẩm Trong Đơn:</h4>
                <div className="border border-neutral-300 divide-y divide-neutral-200">
                  {selectedOrderForDetail.items && selectedOrderForDetail.items.length > 0 ? (
                    selectedOrderForDetail.items.map((item: any, idx: number) => (
                      <div key={idx} className="p-3 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-black uppercase">{item.productTitle}</p>
                          <p className="text-[11px] text-neutral-500">
                            Size: <strong>{item.variantSize}</strong> | Màu: {item.variantColor || 'Tiêu chuẩn'} | SKU: {item.variantSku}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-black">
                            {formatVND(item.unitPrice)} x {item.quantity}
                          </p>
                          <p className="text-neutral-600 font-black">
                            = {formatVND(item.totalPrice || item.unitPrice * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-neutral-500">
                      Không có thông tin chi tiết món
                    </div>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="p-3 bg-neutral-100 border border-neutral-300 flex justify-between items-center font-bold">
                <span>TỔNG CỘNG:</span>
                <span className="text-base text-black">
                  {formatVND(selectedOrderForDetail.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
