import {
  AdminCoupon,
  AdminReview,
  AdminStats,
  Category,
  PaginatedResponse,
  User,
} from './types';
import { authFetch } from './api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

async function parseJsonOrThrow(res: Response, fallback: string) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const error = new Error(err.message || fallback) as any;
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export async function fetchAdminStats(token: string): Promise<AdminStats> {
  const res = await authFetch(`${API_BASE}/orders/admin/stats`, token);
  return parseJsonOrThrow(res, 'Không thể tải thống kê hệ thống');
}

export async function sandboxConfirmPayment(token: string, orderCode: string) {
  const res = await authFetch(
    `${API_BASE}/payments/sandbox/confirm/${encodeURIComponent(orderCode)}`,
    token,
    { method: 'POST' },
  );
  return parseJsonOrThrow(res, 'Giả lập xác nhận thanh toán thất bại');
}

// ===================== ADMIN COUPONS =====================
export async function fetchAdminCoupons(
  token: string,
  params?: { page?: number; limit?: number; search?: string },
): Promise<PaginatedResponse<AdminCoupon>> {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.search?.trim()) q.set('search', params.search.trim());
  const res = await authFetch(`${API_BASE}/coupons/admin${q.toString() ? `?${q}` : ''}`, token);
  return parseJsonOrThrow(res, 'Không thể tải danh sách mã giảm giá');
}

export async function createAdminCoupon(token: string, data: any): Promise<AdminCoupon> {
  const res = await authFetch(`${API_BASE}/coupons/admin`, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return parseJsonOrThrow(res, 'Không thể tạo mã giảm giá');
}

export async function updateAdminCoupon(token: string, id: string, data: any): Promise<AdminCoupon> {
  const res = await authFetch(`${API_BASE}/coupons/admin/${id}`, token, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return parseJsonOrThrow(res, 'Không thể cập nhật mã giảm giá');
}

export async function deleteAdminCoupon(token: string, id: string) {
  const res = await authFetch(`${API_BASE}/coupons/admin/${id}`, token, { method: 'DELETE' });
  return parseJsonOrThrow(res, 'Không thể xóa mã giảm giá');
}

// ===================== ADMIN CATEGORIES =====================
export async function fetchAdminCategories(
  token: string,
): Promise<Array<Category & { sortOrder: number; isActive: boolean }>> {
  const res = await authFetch(`${API_BASE}/categories/admin`, token);
  return parseJsonOrThrow(res, 'Không thể tải danh mục');
}

export async function createAdminCategory(
  token: string,
  data: { name: string; slug?: string; description?: string; sortOrder?: number },
) {
  const res = await authFetch(`${API_BASE}/categories/admin`, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return parseJsonOrThrow(res, 'Không thể tạo danh mục');
}

export async function updateAdminCategory(
  token: string,
  id: string,
  data: { name?: string; description?: string; sortOrder?: number; isActive?: boolean },
) {
  const res = await authFetch(`${API_BASE}/categories/admin/${id}`, token, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return parseJsonOrThrow(res, 'Không thể cập nhật danh mục');
}

export async function deleteAdminCategory(token: string, id: string) {
  const res = await authFetch(`${API_BASE}/categories/admin/${id}`, token, { method: 'DELETE' });
  return parseJsonOrThrow(res, 'Không thể xóa danh mục');
}

// ===================== ADMIN USERS =====================
export async function fetchAdminUsers(
  token: string,
  params?: { page?: number; limit?: number; search?: string },
): Promise<PaginatedResponse<User>> {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.search?.trim()) q.set('search', params.search.trim());
  const res = await authFetch(`${API_BASE}/auth/admin/users${q.toString() ? `?${q}` : ''}`, token);
  return parseJsonOrThrow(res, 'Không thể tải danh sách người dùng');
}

export async function updateAdminUserRole(
  token: string,
  id: string,
  role: 'CUSTOMER' | 'ADMIN' | 'STAFF',
) {
  const res = await authFetch(`${API_BASE}/auth/admin/users/${id}/role`, token, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
  return parseJsonOrThrow(res, 'Không thể cập nhật quyền người dùng');
}

export async function deleteAdminUser(token: string, id: string) {
  const res = await authFetch(`${API_BASE}/auth/admin/users/${id}`, token, { method: 'DELETE' });
  return parseJsonOrThrow(res, 'Không thể xóa người dùng');
}

// ===================== ADMIN REVIEWS =====================
export async function fetchAdminReviews(
  token: string,
  params?: { page?: number; limit?: number; search?: string },
): Promise<PaginatedResponse<AdminReview>> {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.search?.trim()) q.set('search', params.search.trim());
  const res = await authFetch(
    `${API_BASE}/products/admin/reviews${q.toString() ? `?${q}` : ''}`,
    token,
  );
  return parseJsonOrThrow(res, 'Không thể tải danh sách đánh giá');
}

export async function deleteAdminReview(token: string, id: string) {
  const res = await authFetch(`${API_BASE}/products/admin/reviews/${id}`, token, {
    method: 'DELETE',
  });
  return parseJsonOrThrow(res, 'Không thể xóa đánh giá');
}
