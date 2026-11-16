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
  fitScore: number;
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
