import { CartItem, UserAddress, WishlistItem } from './types';
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

export async function changePassword(
  token: string,
  payload: { currentPassword: string; newPassword: string },
) {
  const res = await authFetch(`${API_BASE}/auth/change-password`, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJsonOrThrow(res, 'Đổi mật khẩu thất bại');
}

export async function forgotPassword(email: string) {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return parseJsonOrThrow(res, 'Không thể gửi yêu cầu đặt lại mật khẩu');
}

export async function resetPassword(payload: { token: string; newPassword: string }) {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJsonOrThrow(res, 'Đặt lại mật khẩu thất bại');
}

export async function fetchAddresses(token: string): Promise<UserAddress[]> {
  const res = await authFetch(`${API_BASE}/account/addresses`, token);
  return parseJsonOrThrow(res, 'Không thể tải sổ địa chỉ');
}

export async function createAddress(
  token: string,
  data: Omit<UserAddress, 'id' | 'createdAt'>,
): Promise<UserAddress> {
  const res = await authFetch(`${API_BASE}/account/addresses`, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return parseJsonOrThrow(res, 'Không thể thêm địa chỉ mới');
}

export async function setDefaultAddress(token: string, id: string): Promise<UserAddress> {
  const res = await authFetch(`${API_BASE}/account/addresses/${id}/default`, token, {
    method: 'PATCH',
  });
  return parseJsonOrThrow(res, 'Không thể đặt địa chỉ mặc định');
}

export async function deleteAddress(token: string, id: string) {
  const res = await authFetch(`${API_BASE}/account/addresses/${id}`, token, {
    method: 'DELETE',
  });
  return parseJsonOrThrow(res, 'Không thể xóa địa chỉ');
}

export async function fetchWishlist(token: string): Promise<WishlistItem[]> {
  const res = await authFetch(`${API_BASE}/account/wishlist`, token);
  return parseJsonOrThrow(res, 'Không thể tải danh sách yêu thích');
}

export async function addToWishlist(token: string, productId: string) {
  const res = await authFetch(`${API_BASE}/account/wishlist/${productId}`, token, {
    method: 'POST',
  });
  return parseJsonOrThrow(res, 'Không thể thêm vào yêu thích');
}

export async function removeFromWishlist(token: string, productId: string) {
  const res = await authFetch(`${API_BASE}/account/wishlist/${productId}`, token, {
    method: 'DELETE',
  });
  return parseJsonOrThrow(res, 'Không thể gỡ khỏi yêu thích');
}

export async function validateCartItems(
  items: Array<{ variantId: string; quantity: number }>,
): Promise<{ items: CartItem[]; warnings: string[] }> {
  const res = await fetch(`${API_BASE}/account/cart/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
    cache: 'no-store',
  });
  return parseJsonOrThrow(res, 'Không thể kiểm tra tồn kho giỏ hàng');
}

export async function saveServerCart(
  token: string,
  items: Array<{ variantId: string; quantity: number }>,
): Promise<{ items: CartItem[]; warnings: string[] }> {
  const res = await authFetch(`${API_BASE}/account/cart`, token, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  return parseJsonOrThrow(res, 'Không thể đồng bộ giỏ hàng');
}
