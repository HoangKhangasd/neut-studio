export interface ProductImage {
  id: string;
  imageUrl: string;
  colorAttached?: string | null;
  isCover: boolean;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  colorName: string;
  colorHex: string;
  size: string;
  price: number;
  salePrice?: number | null;
  stockQuantity: number;
}

export interface QuickSize {
  size: string;
  inStock: boolean;
  stock: number;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description?: string;
  materialAndCare?: string;
  sizeGuideHtml?: string;
  categoryId?: string;
  isPublished: boolean;
  isFeatured: boolean;
  minPrice: number;
  originalPrice: number;
  images: ProductImage[];
  variants: ProductVariant[];
  quickSizes: QuickSize[];
  colors?: { name: string; hex: string }[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  bannerUrl?: string;
  isCollab: boolean;
}

export interface StoreLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  phone?: string;
  stock?: number;
  inStock?: boolean;
}

export interface CartItem {
  variantId: string;
  productId: string;
  productTitle: string;
  productSlug: string;
  imageUrl: string;
  colorName: string;
  size: string;
  price: number;
  quantity: number;
  maxStock: number;
}

export interface ProductReview {
  id: string;
  productId: string;
  userId?: string | null;
  customerName: string;
  rating: number;
  fitScore: number; // -1: Tight, 0: True to size, 1: Loose
  userHeightCm?: number | null;
  userWeightKg?: number | null;
  purchasedSize?: string | null;
  comment: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  fitBreakdown: {
    tightPercent: number;
    trueToSizePercent: number;
    loosePercent: number;
  };
  ratingDistribution: { [key: number]: number };
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: 'ADMIN' | 'CUSTOMER';
  createdAt?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface OrderItemSnapshot {
  id: string;
  variantId: string;
  productTitle: string;
  variantSku: string;
  variantColor: string;
  variantSize: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface CustomerOrder {
  id: string;
  orderCode: string;
  userId?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: {
    province: string;
    district: string;
    ward: string;
    street: string;
  };
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
  items: OrderItemSnapshot[];
}

export interface AdminProduct {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  basePrice: number;
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: string;
  category?: Category | null;
  variants: ProductVariant[];
  images: ProductImage[];
}
