import {
  Product,
  Category,
  Collection,
  StoreLocation,
  ProductReview,
  ReviewStats,
  CustomerOrder,
  AdminProduct,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function fetchProducts(params: {
  search?: string;
  categorySlug?: string;
  collectionSlug?: string;
  sizes?: string;
  colors?: string;
  sortBy?: string;
  page?: number;
} = {}): Promise<{ data: Product[]; total: number; page: number; totalPages: number }> {
  try {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.categorySlug && params.categorySlug !== 'all') query.set('categorySlug', params.categorySlug);
    if (params.collectionSlug) query.set('collectionSlug', params.collectionSlug);
    if (params.sizes) query.set('sizes', params.sizes);
    if (params.colors) query.set('colors', params.colors);
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.page) query.set('page', String(params.page));

    const res = await fetch(`${API_BASE}/products?${query.toString()}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  } catch (error) {
    console.error('API Error fetchProducts:', error);
    return { data: [], total: 0, page: 1, totalPages: 0 };
  }
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_BASE}/products/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error('API Error fetchProductBySlug:', error);
    return null;
  }
}

export async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_BASE}/categories`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function fetchCollections(): Promise<Collection[]> {
  try {
    const res = await fetch(`${API_BASE}/collections`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function checkStoreInventory(variantId: string): Promise<StoreLocation[]> {
  try {
    const res = await fetch(`${API_BASE}/stores/inventory?variantId=${variantId}`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function calculateFitFinder(data: {
  heightCm: number;
  weightKg: number;
  bodyType: string;
  fitPreference: string;
}) {
  const res = await fetch(`${API_BASE}/products/fit-finder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Fit finder failed');
  return res.json();
}

export async function subscribeNewsletter(phone: string) {
  const res = await fetch(`${API_BASE}/leads/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  return res.json();
}

export async function createOrder(data: any) {
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Lỗi khi đặt hàng');
  }
  return res.json();
}

export async function fetchStores(): Promise<StoreLocation[]> {
  try {
    const res = await fetch(`${API_BASE}/stores`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function trackOrder(orderCode: string) {
  const res = await fetch(`${API_BASE}/orders/track/${encodeURIComponent(orderCode)}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Không tìm thấy đơn hàng');
  }
  return res.json();
}

export async function loginUser(credentials: { email: string; password: string }) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Đăng nhập không thành công');
  }
  return res.json();
}

export async function fetchAdminOrders(token: string) {
  const res = await fetch(`${API_BASE}/orders/admin/all`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Không thể tải danh sách đơn hàng');
  return res.json();
}

export async function updateAdminOrderStatus(orderId: string, status: string, token: string) {
  const res = await fetch(`${API_BASE}/orders/admin/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Cập nhật trạng thái thất bại');
  return res.json();
}

export async function fetchProductReviews(
  slug: string,
): Promise<{ reviews: ProductReview[]; stats: ReviewStats }> {
  try {
    const res = await fetch(`${API_BASE}/products/${slug}/reviews`, { cache: 'no-store' });
    if (!res.ok) {
      return {
        reviews: [],
        stats: {
          totalReviews: 0,
          averageRating: 5,
          fitBreakdown: { tightPercent: 0, trueToSizePercent: 100, loosePercent: 0 },
          ratingDistribution: {},
        },
      };
    }
    return res.json();
  } catch {
    return {
      reviews: [],
      stats: {
        totalReviews: 0,
        averageRating: 5,
        fitBreakdown: { tightPercent: 0, trueToSizePercent: 100, loosePercent: 0 },
        ratingDistribution: {},
      },
    };
  }
}

export async function submitProductReview(
  slug: string,
  data: {
    customerName: string;
    rating: number;
    fitScore: number;
    userHeightCm?: number;
    userWeightKg?: number;
    purchasedSize?: string;
    comment: string;
    images?: string[];
  },
) {
  const res = await fetch(`${API_BASE}/products/${slug}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Không thể gửi đánh giá');
  }
  return res.json();
}

export async function uploadReviewImageToMinIO(file: File): Promise<string> {
  const presignRes = await fetch(`${API_BASE}/storage/presigned-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName: file.name, contentType: file.type || 'image/jpeg' }),
  });
  if (!presignRes.ok) throw new Error('Không thể khởi tạo liên kết tải ảnh lên MinIO');
  const { uploadUrl, publicUrl } = await presignRes.json();

  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'image/jpeg' },
    body: file,
  });
  if (!putRes.ok) throw new Error('Tải ảnh trực tiếp lên MinIO thất bại');
  return publicUrl;
}

export async function registerUser(data: {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Đăng ký tài khoản thất bại');
  }
  return res.json();
}

export async function fetchMyOrders(token: string): Promise<CustomerOrder[]> {
  const res = await fetch(`${API_BASE}/orders/my-orders`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Không thể tải lịch sử đơn hàng');
  }
  return res.json();
}

export async function fetchAdminProducts(token: string): Promise<AdminProduct[]> {
  const res = await fetch(`${API_BASE}/products/admin/all`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Không thể tải danh sách sản phẩm');
  }
  return res.json();
}

export async function updateAdminVariantStock(
  variantId: string,
  data: { stockQuantity?: number; price?: number; salePrice?: number },
  token: string,
) {
  const res = await fetch(`${API_BASE}/products/admin/variants/${variantId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Cập nhật kho biến thể thất bại');
  }
  return res.json();
}

export async function updateAdminProduct(
  productId: string,
  data: {
    title?: string;
    description?: string;
    categoryId?: string;
    basePrice?: number;
    images?: string[];
    isPublished?: boolean;
    isFeatured?: boolean;
    variants?: any[];
  },
  token: string,
) {
  const res = await fetch(`${API_BASE}/products/admin/${productId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Cập nhật sản phẩm thất bại');
  }
  return res.json();
}

export async function deleteAdminProduct(productId: string, token: string) {
  const res = await fetch(`${API_BASE}/products/admin/${productId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Xóa sản phẩm thất bại');
  }
  return res.json();
}

export async function createAdminProduct(data: any, token: string) {
  const res = await fetch(`${API_BASE}/products/admin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Tạo sản phẩm thất bại');
  }
  return res.json();
}
