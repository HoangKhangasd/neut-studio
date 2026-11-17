import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { eq, and, or, ilike, desc, asc, sql, inArray } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.module.js';
import {
  products,
  productVariants,
  productImages,
  categories,
  collections,
  collectionProducts,
  productReviews,
  orders,
  orderItems,
  users,
} from '../../database/schema/index.js';
import {
  ProductQueryDto,
  AdminProductQueryDto,
  FitFinderDto,
  CreateReviewDto,
  UpdateVariantStockDto,
  UpdateProductAdminDto,
  CreateProductAdminDto,
} from './dto/products.dto.js';

@Injectable()
export class ProductsService {
  constructor(@Inject(DRIZZLE) private readonly db: any) {}

  private async resolveCategoryId(rawCategoryId?: string | null): Promise<string | null> {
    if (!rawCategoryId || typeof rawCategoryId !== 'string' || !rawCategoryId.trim()) {
      return null;
    }
    const trimmed = rawCategoryId.trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);
    if (isUuid) {
      const exists = await this.db.query.categories.findFirst({
        where: eq(categories.id, trimmed),
      });
      return exists ? exists.id : null;
    }

    const found = await this.db.query.categories.findFirst({
      where: or(
        eq(categories.slug, trimmed.toLowerCase()),
        ilike(categories.name, trimmed),
      ),
    });
    return found ? found.id : null;
  }

  // ===================== CATEGORIES =====================
  async getCategories() {
    return this.db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.sortOrder));
  }

  // ===================== COLLECTIONS =====================
  async getCollections() {
    return this.db.select().from(collections).where(eq(collections.isActive, true));
  }

  async getCollectionBySlug(slug: string) {
    const col = await this.db.query.collections.findFirst({
      where: and(eq(collections.slug, slug), eq(collections.isActive, true)),
    });
    if (!col) throw new NotFoundException('Không tìm thấy bộ sưu tập');
    return col;
  }

  // ===================== PRODUCTS =====================
  async getProducts(query: ProductQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(50, Number(query.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions: any[] = [
      eq(products.isPublished, true),
      sql`${products.deletedAt} IS NULL`,
    ];

    if (query.search?.trim()) {
      conditions.push(ilike(products.title, `%${query.search.trim()}%`));
    }

    if (query.categorySlug) {
      const cat = await this.db.query.categories.findFirst({
        where: eq(categories.slug, query.categorySlug),
      });
      if (!cat) {
        return { data: [], total: 0, page, totalPages: 0 };
      }
      conditions.push(eq(products.categoryId, cat.id));
    }

    // Sort order
    let orderByClause = desc(products.createdAt);
    if (query.sortBy === 'featured') orderByClause = desc(products.isFeatured);

    // Fetch base products
    const productList = await this.db
      .select()
      .from(products)
      .where(and(...conditions))
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    if (productList.length === 0) {
      return { data: [], total: 0, page, totalPages: 0 };
    }

    const productIds = productList.map((p: any) => p.id);

    // Fetch variants & images
    const variants = await this.db
      .select()
      .from(productVariants)
      .where(
        and(
          inArray(productVariants.productId, productIds),
          sql`${productVariants.deletedAt} IS NULL`,
        ),
      );

    const images = await this.db
      .select()
      .from(productImages)
      .where(inArray(productImages.productId, productIds))
      .orderBy(asc(productImages.sortOrder));

    // Combine & calculate Quick Size Bar
    const formatted = productList.map((prod: any) => {
      const prodVariants = variants.filter((v: any) => v.productId === prod.id);
      const prodImages = images.filter((img: any) => img.productId === prod.id);

      // Aggregate sizes for Quick Size Bar (S, M, L, XL...)
      const sizeMap = new Map<string, number>();
      for (const v of prodVariants) {
        const currentStock = sizeMap.get(v.size) || 0;
        sizeMap.set(v.size, currentStock + v.stockQuantity);
      }

      const quickSizes = Array.from(sizeMap.entries()).map(([size, totalStock]) => ({
        size,
        inStock: totalStock > 0,
        stock: totalStock,
      }));

      // Min/Max price
      const prices = prodVariants.map((v: any) => v.salePrice ?? v.price);
      const minPrice = prices.length ? Math.min(...prices) : 0;
      const originalPrice = prodVariants.length ? prodVariants[0].price : 0;

      return {
        ...prod,
        minPrice,
        originalPrice,
        images: prodImages,
        variants: prodVariants,
        quickSizes,
      };
    });

    // Count total for pagination
    const [{ count }] = await this.db
      .select({ count: sql`count(*)` })
      .from(products)
      .where(and(...conditions));

    const total = Number(count);
    return {
      data: formatted,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getProductBySlug(slug: string) {
    const prod = await this.db.query.products.findFirst({
      where: and(
        eq(products.slug, slug),
        eq(products.isPublished, true),
        sql`${products.deletedAt} IS NULL`,
      ),
    });

    if (!prod) throw new NotFoundException('Không tìm thấy sản phẩm');

    let category = null;
    if (prod.categoryId) {
      category = await this.db.query.categories.findFirst({
        where: eq(categories.id, prod.categoryId),
      });
    }

    const variants = await this.db
      .select()
      .from(productVariants)
      .where(
        and(
          eq(productVariants.productId, prod.id),
          sql`${productVariants.deletedAt} IS NULL`,
        ),
      );

    const images = await this.db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, prod.id))
      .orderBy(asc(productImages.sortOrder));

    // Colors available
    const colors = Array.from(
      new Map(variants.map((v: any) => [v.colorName, { name: v.colorName, hex: v.colorHex }])).values(),
    );

    // Min and original price calculation
    const prices = variants.map((v: any) => v.salePrice ?? v.price);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const originalPrice = variants.length ? variants[0].price : 0;

    // Quick Sizes
    const sizeMap = new Map<string, number>();
    for (const v of variants) {
      const currentStock = sizeMap.get(v.size) || 0;
      sizeMap.set(v.size, currentStock + v.stockQuantity);
    }
    const quickSizes = Array.from(sizeMap.entries()).map(([size, totalStock]) => ({
      size,
      inStock: totalStock > 0,
      stock: totalStock,
    }));

    return {
      ...prod,
      category,
      minPrice,
      originalPrice,
      variants,
      images,
      colors,
      quickSizes,
    };
  }

  // ===================== SMART FIT FINDER =====================
  calculateFit(dto: FitFinderDto) {
    const { heightCm, weightKg, bodyType, fitPreference } = dto;
    if (!Number.isFinite(heightCm) || !Number.isFinite(weightKg) || heightCm <= 0 || weightKg <= 0) {
      throw new BadRequestException('Chiều cao và cân nặng phải lớn hơn 0');
    }

    const rawBmi = weightKg / ((heightCm / 100) * (heightCm / 100));
    const bodyAdjustment = bodyType === 'slim' ? -1.5 : bodyType === 'full' ? 1.5 : 0;
    const bmi = rawBmi + bodyAdjustment;

    let recommendedSize = 'M';
    let confidence = 88;

    if (heightCm < 165) {
      recommendedSize = bmi > 24 ? 'M' : 'S';
    } else if (heightCm <= 173) {
      recommendedSize = bmi > 25 ? 'L' : bmi > 22 ? 'M' : 'S';
    } else if (heightCm <= 180) {
      recommendedSize = bmi > 26 ? 'XL' : bmi > 23 ? 'L' : 'M';
    } else {
      recommendedSize = bmi > 25 ? 'XXL' : 'XL';
    }

    // Streetwear fit preference adjustment
    if (fitPreference === 'oversize' && recommendedSize !== 'XXL') {
      const sizeOrder = ['S', 'M', 'L', 'XL', 'XXL'];
      const currentIndex = sizeOrder.indexOf(recommendedSize);
      if (currentIndex !== -1 && currentIndex < sizeOrder.length - 1) {
        recommendedSize = sizeOrder[currentIndex + 1];
        confidence = 92;
      }
    } else if (fitPreference === 'tight' && recommendedSize !== 'S') {
      const sizeOrder = ['S', 'M', 'L', 'XL', 'XXL'];
      const currentIndex = sizeOrder.indexOf(recommendedSize);
      if (currentIndex > 0) {
        recommendedSize = sizeOrder[currentIndex - 1];
      }
    }

    return {
      recommendedSize,
      confidence,
      reason: `Dựa trên số đo ${heightCm}cm, ${weightKg}kg (${bodyType}) và phong cách mặc ${fitPreference}, cỡ ${recommendedSize} sẽ mang lại form dáng chuẩn nhất.`,
    };
  }

  // ===================== PRODUCT REVIEWS =====================
  async getProductReviews(slug: string) {
    const prod = await this.db.query.products.findFirst({
      where: eq(products.slug, slug),
    });

    if (!prod) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    const reviews = await this.db
      .select()
      .from(productReviews)
      .where(eq(productReviews.productId, prod.id))
      .orderBy(desc(productReviews.createdAt));

    const total = reviews.length;
    let avg = 5.0;
    let tightCount = 0;
    let trueCount = 0;
    let looseCount = 0;
    const ratingDist: { [key: number]: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    if (total > 0) {
      const sum = reviews.reduce((acc: number, r: any) => {
        ratingDist[r.rating] = (ratingDist[r.rating] || 0) + 1;
        if (r.fitScore < 0) tightCount++;
        else if (r.fitScore > 0) looseCount++;
        else trueCount++;
        return acc + r.rating;
      }, 0);
      avg = Math.round((sum / total) * 10) / 10;
    }

    return {
      reviews,
      stats: {
        totalReviews: total,
        averageRating: avg,
        fitBreakdown: {
          tightPercent: total > 0 ? Math.round((tightCount / total) * 100) : 0,
          trueToSizePercent: total > 0 ? Math.round((trueCount / total) * 100) : 100,
          loosePercent: total > 0 ? Math.round((looseCount / total) * 100) : 0,
        },
        ratingDistribution: ratingDist,
      },
    };
  }

  async createProductReview(slug: string, dto: CreateReviewDto, userId?: string) {
    if (!userId) {
      throw new ForbiddenException('Vui lòng đăng nhập để viết đánh giá cho sản phẩm');
    }

    const prod = await this.db.query.products.findFirst({
      where: eq(products.slug, slug),
    });

    if (!prod) {
      throw new NotFoundException('Không tìm thấy sản phẩm để đánh giá');
    }

    const existingReview = await this.db.query.productReviews.findFirst({
      where: and(
        eq(productReviews.productId, prod.id),
        eq(productReviews.userId, userId),
      ),
    });

    if (existingReview) {
      throw new ConflictException('Bạn đã đánh giá sản phẩm này rồi');
    }

    // Verify user has purchased this product and order status is COMPLETED
    const prodVariants = await this.db
      .select({ id: productVariants.id })
      .from(productVariants)
      .where(eq(productVariants.productId, prod.id));

    const variantIds = prodVariants.map((v: any) => v.id);

    if (variantIds.length === 0) {
      throw new ForbiddenException('Sản phẩm chưa có biến thể nào để đánh giá');
    }

    const eligibleOrders = await this.db
      .select({ orderId: orders.id, variantSize: orderItems.variantSize })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .where(
        and(
          eq(orders.userId, userId),
          eq(orders.orderStatus, 'COMPLETED'),
          inArray(orderItems.variantId, variantIds),
        ),
      )
      .limit(1);

    if (eligibleOrders.length === 0) {
      throw new ForbiddenException(
        'Bạn chỉ có thể đánh giá sản phẩm sau khi đã mua và đơn hàng được giao thành công (COMPLETED)',
      );
    }

    const author = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    const [review] = await this.db
      .insert(productReviews)
      .values({
        productId: prod.id,
        userId: userId,
        customerName: author?.fullName?.trim() || dto.customerName?.trim() || 'Khách hàng Neut',
        rating: Math.max(1, Math.min(5, dto.rating)),
        fitScore: dto.fitScore,
        userHeightCm: dto.userHeightCm || null,
        userWeightKg: dto.userWeightKg || null,
        purchasedSize: eligibleOrders[0].variantSize || dto.purchasedSize || null,
        comment: dto.comment,
        images: dto.images || [],
        isVerifiedPurchase: true,
      })
      .returning();

    return review;
  }

  // ===================== ADMIN PRODUCT MANAGEMENT =====================
  async getAdminProducts(query?: AdminProductQueryDto) {
    const page = Math.max(1, Math.floor(Number(query?.page)) || 1);
    const limit = Math.max(1, Math.min(100, Math.floor(Number(query?.limit)) || 10));
    const offset = (page - 1) * limit;

    const conditions: any[] = [sql`${products.deletedAt} IS NULL`];
    if (query?.search?.trim()) {
      const term = `%${query.search.trim()}%`;
      conditions.push(or(ilike(products.title, term), ilike(products.slug, term)));
    }
    const whereClause = and(...conditions);

    const [{ count }] = await this.db
      .select({ count: sql`count(*)` })
      .from(products)
      .where(whereClause);

    const total = Number(count);
    const totalPages = Math.ceil(total / limit);

    const prods = await this.db
      .select()
      .from(products)
      .where(whereClause)
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);

    if (prods.length === 0) {
      return { data: [], total, page, totalPages };
    }

    const productIds = prods.map((p: any) => p.id);
    const categoryIds = Array.from(
      new Set(prods.map((p: any) => p.categoryId).filter(Boolean)),
    ) as string[];

    const [variants, images, categoryRows] = await Promise.all([
      this.db
        .select()
        .from(productVariants)
        .where(
          and(
            inArray(productVariants.productId, productIds),
            sql`${productVariants.deletedAt} IS NULL`,
          ),
        ),
      this.db
        .select()
        .from(productImages)
        .where(inArray(productImages.productId, productIds))
        .orderBy(asc(productImages.sortOrder)),
      categoryIds.length > 0
        ? this.db.select().from(categories).where(inArray(categories.id, categoryIds))
        : Promise.resolve([]),
    ]);

    const categoryMap = new Map(categoryRows.map((c: any) => [c.id, c]));

    const data = prods.map((prod: any) => {
      const vars = variants.filter((v: any) => v.productId === prod.id);
      const imgs = images.filter((img: any) => img.productId === prod.id);
      const prices = vars.map((v: any) => v.salePrice ?? v.price);
      const basePrice = prices.length ? Math.min(...prices) : 0;

      return {
        ...prod,
        basePrice,
        category: prod.categoryId ? categoryMap.get(prod.categoryId) ?? null : null,
        variants: vars,
        images: imgs,
      };
    });

    return { data, total, page, totalPages };
  }

  async updateVariantInventory(variantId: string, dto: UpdateVariantStockDto) {
    const updateData: any = { updatedAt: new Date() };
    if (dto.stockQuantity !== undefined) updateData.stockQuantity = dto.stockQuantity;
    if (dto.price !== undefined) updateData.price = dto.price;
    if (dto.salePrice !== undefined) updateData.salePrice = dto.salePrice;

    const [updated] = await this.db
      .update(productVariants)
      .set(updateData)
      .where(eq(productVariants.id, variantId))
      .returning();

    if (!updated) throw new NotFoundException('Không tìm thấy biến thể sản phẩm');
    return updated;
  }

  async updateProductAdmin(productId: string, dto: UpdateProductAdminDto) {
    const updateData: any = { updatedAt: new Date() };
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.categoryId !== undefined) {
      updateData.categoryId = await this.resolveCategoryId(dto.categoryId);
    }
    if (dto.isPublished !== undefined) updateData.isPublished = dto.isPublished;
    if (dto.isFeatured !== undefined) updateData.isFeatured = dto.isFeatured;

    return this.db.transaction(async (tx: any) => {
      const [updated] = await tx
        .update(products)
        .set(updateData)
        .where(eq(products.id, productId))
        .returning();

      if (!updated) throw new NotFoundException('Không tìm thấy sản phẩm');

      // Update images if provided
      if (dto.images !== undefined) {
        await tx.delete(productImages).where(eq(productImages.productId, productId));

        for (let i = 0; i < dto.images.length; i++) {
          const imgUrl = dto.images[i];
          let minioKey = `products/${updated.slug}-${i}-${Date.now()}.jpg`;
          if (typeof imgUrl === 'string' && imgUrl.includes('/products/')) {
            const parts = imgUrl.split('/products/');
            const extracted = parts[parts.length - 1];
            if (extracted && extracted.trim()) {
              minioKey = extracted.startsWith('products/') ? extracted.trim() : `products/${extracted.trim()}`;
            }
          }

          await tx.insert(productImages).values({
            productId: updated.id,
            minioBucket: 'products',
            minioKey,
            imageUrl: imgUrl,
            isCover: i === 0,
            sortOrder: i,
          });
        }
      }

      // Update variants if provided
      if (dto.variants && dto.variants.length > 0) {
        const existingVariants = await tx
          .select()
          .from(productVariants)
          .where(
            and(
              eq(productVariants.productId, productId),
              sql`${productVariants.deletedAt} IS NULL`,
            ),
          );

        for (const v of dto.variants) {
          const match = v.id
            ? existingVariants.find((ev: any) => ev.id === v.id)
            : existingVariants.find((ev: any) => ev.size === v.size);

          if (match) {
            const varUpdate: any = { updatedAt: new Date() };
            if (v.stockQuantity !== undefined) varUpdate.stockQuantity = v.stockQuantity;
            if (v.price !== undefined) varUpdate.price = v.price;
            else if (dto.basePrice !== undefined) varUpdate.price = dto.basePrice;
            if (v.colorName !== undefined) varUpdate.colorName = v.colorName;
            if (v.colorHex !== undefined) varUpdate.colorHex = v.colorHex;

            await tx.update(productVariants).set(varUpdate).where(eq(productVariants.id, match.id));
          } else {
            const sku = `${updated.slug.slice(0, 10).toUpperCase()}-${(v.colorName || 'BLK').slice(0, 3).toUpperCase()}-${v.size}`;
            await tx.insert(productVariants).values({
              productId: updated.id,
              sku,
              size: v.size,
              colorName: v.colorName || 'Đen',
              colorHex: v.colorHex || '#000000',
              price: v.price || dto.basePrice || 0,
              stockQuantity: v.stockQuantity || 0,
            });
          }
        }
      } else if (dto.basePrice !== undefined) {
        await tx
          .update(productVariants)
          .set({ price: dto.basePrice, updatedAt: new Date() })
          .where(eq(productVariants.productId, productId));
      }

      return updated;
    });
  }

  async deleteProductAdmin(productId: string) {
    const [deleted] = await this.db
      .update(products)
      .set({ deletedAt: new Date(), isPublished: false, updatedAt: new Date() })
      .where(eq(products.id, productId))
      .returning();

    if (!deleted) throw new NotFoundException('Không tìm thấy sản phẩm để xóa');

    await this.db
      .update(productVariants)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(productVariants.productId, productId));

    return {
      success: true,
      message: 'Đã xóa sản phẩm thành công',
      id: productId,
    };
  }

  async createProductAdmin(dto: CreateProductAdminDto) {
    const removeVietnameseTones = (str: string) => {
      return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
    };

    const cleanSlugBase =
      dto.slug?.trim() ||
      removeVietnameseTones(dto.title)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    const slug = `${cleanSlugBase || 'product'}-${Math.floor(1000 + Math.random() * 9000)}`;
    const resolvedCategoryId = await this.resolveCategoryId(dto.categoryId);

    return this.db.transaction(async (tx: any) => {
      const [newProd] = await tx
        .insert(products)
        .values({
          title: dto.title,
          slug,
          description: dto.description || '',
          categoryId: resolvedCategoryId,
          isPublished: true,
          isFeatured: false,
        })
        .returning();

      // Images
      if (dto.images && dto.images.length > 0) {
        for (let i = 0; i < dto.images.length; i++) {
          const imgUrl = dto.images[i];
          let minioKey = `products/${newProd.slug}-${i}-${Date.now()}.jpg`;
          if (typeof imgUrl === 'string' && imgUrl.includes('/products/')) {
            const parts = imgUrl.split('/products/');
            const extracted = parts[parts.length - 1];
            if (extracted && extracted.trim()) {
              minioKey = extracted.startsWith('products/') ? extracted.trim() : `products/${extracted.trim()}`;
            }
          }

          await tx.insert(productImages).values({
            productId: newProd.id,
            minioBucket: 'products',
            minioKey,
            imageUrl: imgUrl,
            isCover: i === 0,
            sortOrder: i,
          });
        }
      }

      // Variants
      const defaultSizes = ['S', 'M', 'L', 'XL'];
      const variantsToCreate =
        dto.variants && dto.variants.length > 0
          ? dto.variants
          : defaultSizes.map((s) => ({
              size: s,
              colorName: 'Đen',
              colorHex: '#000000',
              stockQuantity: 20,
              price: dto.basePrice,
            }));

      for (const v of variantsToCreate) {
        const cleanColor =
          removeVietnameseTones(v.colorName || 'BLK')
            .replace(/[^a-zA-Z0-9]/g, '')
            .toUpperCase()
            .slice(0, 3) || 'BLK';
        const cleanPrefix =
          removeVietnameseTones(slug)
            .replace(/[^a-zA-Z0-9]/g, '')
            .toUpperCase()
            .slice(0, 8) || 'PROD';
        const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
        const sku = `${cleanPrefix}-${cleanColor}-${v.size}-${randomSuffix}`;

        await tx.insert(productVariants).values({
          productId: newProd.id,
          sku,
          size: v.size,
          colorName: v.colorName || 'Đen',
          colorHex: v.colorHex || '#000000',
          price: v.price || dto.basePrice,
          stockQuantity: v.stockQuantity,
        });
      }

      return newProd;
    });
  }

  // ===================== ADMIN CATEGORIES & REVIEWS =====================
  async getAdminCategories() {
    return this.db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name));
  }

  async createCategoryAdmin(dto: {
    name: string;
    slug?: string;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    if (!dto.name?.trim()) {
      throw new BadRequestException('Vui lòng nhập tên danh mục');
    }
    const baseSlug =
      dto.slug?.trim().toLowerCase() ||
      dto.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const existing = await this.db.query.categories.findFirst({
      where: eq(categories.slug, baseSlug),
    });
    if (existing) {
      throw new ConflictException(`Danh mục với slug '${baseSlug}' đã tồn tại`);
    }

    const [created] = await this.db
      .insert(categories)
      .values({
        name: dto.name.trim(),
        slug: baseSlug,
        description: dto.description?.trim() || null,
        sortOrder: Number(dto.sortOrder) || 0,
        isActive: dto.isActive ?? true,
      })
      .returning();
    return created;
  }

  async updateCategoryAdmin(
    id: string,
    dto: { name?: string; description?: string; sortOrder?: number; isActive?: boolean },
  ) {
    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name.trim();
    if (dto.description !== undefined) updateData.description = dto.description.trim();
    if (dto.sortOrder !== undefined) updateData.sortOrder = Number(dto.sortOrder) || 0;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    const [updated] = await this.db
      .update(categories)
      .set(updateData)
      .where(eq(categories.id, id))
      .returning();

    if (!updated) throw new NotFoundException('Không tìm thấy danh mục');
    return updated;
  }

  async deleteCategoryAdmin(id: string) {
    const [deleted] = await this.db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning({ id: categories.id });
    if (!deleted) throw new NotFoundException('Không tìm thấy danh mục để xóa');
    return { success: true, id };
  }

  async getAdminReviews(query?: AdminProductQueryDto) {
    const page = Math.max(1, Math.floor(Number(query?.page)) || 1);
    const limit = Math.max(1, Math.min(100, Math.floor(Number(query?.limit)) || 10));
    const offset = (page - 1) * limit;

    const whereClause = query?.search?.trim()
      ? or(
          ilike(productReviews.customerName, `%${query.search.trim()}%`),
          ilike(productReviews.comment, `%${query.search.trim()}%`),
        )
      : undefined;

    const [{ count }] = await this.db
      .select({ count: sql`count(*)` })
      .from(productReviews)
      .where(whereClause);

    const total = Number(count);
    const totalPages = Math.ceil(total / limit);

    const rows = await this.db
      .select({
        id: productReviews.id,
        productId: productReviews.productId,
        productTitle: products.title,
        productSlug: products.slug,
        customerName: productReviews.customerName,
        rating: productReviews.rating,
        fitScore: productReviews.fitScore,
        purchasedSize: productReviews.purchasedSize,
        comment: productReviews.comment,
        isVerifiedPurchase: productReviews.isVerifiedPurchase,
        createdAt: productReviews.createdAt,
      })
      .from(productReviews)
      .leftJoin(products, eq(productReviews.productId, products.id))
      .where(whereClause)
      .orderBy(desc(productReviews.createdAt))
      .limit(limit)
      .offset(offset);

    return { data: rows, total, page, totalPages };
  }

  async deleteReviewAdmin(id: string) {
    const [deleted] = await this.db
      .delete(productReviews)
      .where(eq(productReviews.id, id))
      .returning({ id: productReviews.id });
    if (!deleted) throw new NotFoundException('Không tìm thấy đánh giá để xóa');
    return { success: true, id };
  }
}
