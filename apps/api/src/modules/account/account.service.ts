import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, inArray, isNull } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.module.js';
import {
  userAddresses,
  wishlists,
  carts,
  cartItems,
  products,
  productVariants,
  productImages,
} from '../../database/schema/index.js';
import { UpsertAddressDto, CartSyncItemDto } from './dto/account.dto.js';

@Injectable()
export class AccountService {
  constructor(@Inject(DRIZZLE) private readonly db: any) {}

  // ===================== ADDRESS BOOK =====================
  async getAddresses(userId: string) {
    return this.db
      .select()
      .from(userAddresses)
      .where(eq(userAddresses.userId, userId))
      .orderBy(desc(userAddresses.isDefault), desc(userAddresses.createdAt));
  }

  async createAddress(userId: string, dto: UpsertAddressDto) {
    return this.db.transaction(async (tx: any) => {
      if (dto.isDefault) {
        await tx
          .update(userAddresses)
          .set({ isDefault: false })
          .where(eq(userAddresses.userId, userId));
      }

      const [created] = await tx
        .insert(userAddresses)
        .values({
          userId,
          recipientName: dto.recipientName.trim(),
          phoneNumber: dto.phoneNumber.trim(),
          province: dto.province.trim(),
          district: dto.district.trim(),
          ward: dto.ward.trim(),
          streetAddress: dto.streetAddress.trim(),
          isDefault: dto.isDefault ?? false,
        })
        .returning();
      return created;
    });
  }

  async setDefaultAddress(userId: string, addressId: string) {
    return this.db.transaction(async (tx: any) => {
      await tx
        .update(userAddresses)
        .set({ isDefault: false })
        .where(eq(userAddresses.userId, userId));

      const [updated] = await tx
        .update(userAddresses)
        .set({ isDefault: true })
        .where(and(eq(userAddresses.id, addressId), eq(userAddresses.userId, userId)))
        .returning();

      if (!updated) throw new NotFoundException('Không tìm thấy địa chỉ');
      return updated;
    });
  }

  async deleteAddress(userId: string, addressId: string) {
    const [deleted] = await this.db
      .delete(userAddresses)
      .where(and(eq(userAddresses.id, addressId), eq(userAddresses.userId, userId)))
      .returning({ id: userAddresses.id });
    if (!deleted) throw new NotFoundException('Không tìm thấy địa chỉ để xóa');
    return { success: true, id: addressId };
  }

  // ===================== WISHLIST =====================
  async getWishlist(userId: string) {
    const rows = await this.db
      .select()
      .from(wishlists)
      .where(eq(wishlists.userId, userId))
      .orderBy(desc(wishlists.createdAt));

    if (rows.length === 0) return [];
    const productIds = rows.map((r: any) => r.productId);

    const [prodRows, variants, images] = await Promise.all([
      this.db
        .select()
        .from(products)
        .where(
          and(
            inArray(products.id, productIds),
            eq(products.isPublished, true),
            isNull(products.deletedAt),
          ),
        ),
      this.db
        .select()
        .from(productVariants)
        .where(and(inArray(productVariants.productId, productIds), isNull(productVariants.deletedAt))),
      this.db
        .select()
        .from(productImages)
        .where(inArray(productImages.productId, productIds))
        .orderBy(asc(productImages.sortOrder)),
    ]);

    const prodMap = new Map<string, any>(prodRows.map((p: any) => [p.id, p]));

    return rows
      .map((row: any) => {
        const prod = prodMap.get(row.productId);
        if (!prod) return null;
        const pVars = variants.filter((v: any) => v.productId === prod.id);
        const pImgs = images.filter((i: any) => i.productId === prod.id);
        const prices = pVars.map((v: any) => v.salePrice ?? v.price);
        return {
          id: row.id,
          productId: prod.id,
          title: prod.title,
          slug: prod.slug,
          minPrice: prices.length ? Math.min(...prices) : 0,
          coverImage: pImgs[0]?.imageUrl || null,
          inStock: pVars.some((v: any) => v.stockQuantity > 0),
          createdAt: row.createdAt,
        };
      })
      .filter(Boolean);
  }

  async addToWishlist(userId: string, productId: string) {
    const prod = await this.db.query.products.findFirst({
      where: and(eq(products.id, productId), eq(products.isPublished, true), isNull(products.deletedAt)),
    });
    if (!prod) throw new NotFoundException('Không tìm thấy sản phẩm');

    await this.db
      .insert(wishlists)
      .values({ userId, productId })
      .onConflictDoNothing();

    return { success: true, productId };
  }

  async removeFromWishlist(userId: string, productId: string) {
    await this.db
      .delete(wishlists)
      .where(and(eq(wishlists.userId, userId), eq(wishlists.productId, productId)));
    return { success: true, productId };
  }

  // ===================== CART SYNC & LIVE VALIDATION =====================
  async validateCartItems(rawItems: CartSyncItemDto[]) {
    if (!rawItems || rawItems.length === 0) {
      return { items: [], warnings: [] as string[] };
    }

    const variantIds = Array.from(new Set(rawItems.map((i) => i.variantId)));
    const variants = await this.db
      .select()
      .from(productVariants)
      .where(and(inArray(productVariants.id, variantIds), isNull(productVariants.deletedAt)));

    if (variants.length === 0) {
      return {
        items: [],
        warnings: ['Một số sản phẩm trong giỏ đã ngừng bán và được gỡ bỏ.'],
      };
    }

    const productIds = Array.from(new Set(variants.map((v: any) => v.productId))) as string[];
    const [prodRows, imgRows] = await Promise.all([
      this.db
        .select()
        .from(products)
        .where(
          and(
            inArray(products.id, productIds),
            eq(products.isPublished, true),
            isNull(products.deletedAt),
          ),
        ),
      this.db
        .select()
        .from(productImages)
        .where(inArray(productImages.productId, productIds))
        .orderBy(asc(productImages.sortOrder)),
    ]);

    const variantMap = new Map<string, any>(variants.map((v: any) => [v.id, v]));
    const prodMap = new Map<string, any>(prodRows.map((p: any) => [p.id, p]));

    const syncedItems: any[] = [];
    const warnings: string[] = [];

    for (const reqItem of rawItems) {
      const variant = variantMap.get(reqItem.variantId);
      if (!variant) {
        warnings.push('Một sản phẩm trong giỏ không còn tồn tại và đã bị gỡ bỏ.');
        continue;
      }
      const prod = prodMap.get(variant.productId);
      if (!prod) {
        warnings.push('Một sản phẩm đã ngừng kinh doanh và được gỡ bỏ khỏi giỏ.');
        continue;
      }
      if (variant.stockQuantity <= 0) {
        warnings.push(`"${prod.title}" (Size ${variant.size}) đã hết hàng.`);
        continue;
      }

      const clampedQty = Math.min(variant.stockQuantity, Math.max(1, Math.floor(reqItem.quantity)));
      if (clampedQty < reqItem.quantity) {
        warnings.push(
          `"${prod.title}" (Size ${variant.size}) chỉ còn ${variant.stockQuantity} sản phẩm trong kho.`,
        );
      }

      const coverImg =
        imgRows.find((img: any) => img.productId === prod.id)?.imageUrl ||
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800';

      syncedItems.push({
        variantId: variant.id,
        productId: prod.id,
        productTitle: prod.title,
        productSlug: prod.slug,
        imageUrl: coverImg,
        colorName: variant.colorName,
        size: variant.size,
        price: variant.salePrice ?? variant.price,
        quantity: clampedQty,
        maxStock: variant.stockQuantity,
      });
    }

    return { items: syncedItems, warnings };
  }

  async getServerCart(userId: string) {
    const cart = await this.db.query.carts.findFirst({
      where: eq(carts.userId, userId),
    });
    if (!cart) return { items: [], warnings: [] };

    const rows = await this.db
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, cart.id));

    return this.validateCartItems(
      rows.map((r: any) => ({ variantId: r.variantId, quantity: r.quantity })),
    );
  }

  async saveServerCart(userId: string, rawItems: CartSyncItemDto[]) {
    const validated = await this.validateCartItems(rawItems);

    await this.db.transaction(async (tx: any) => {
      let cart = await tx.query.carts.findFirst({
        where: eq(carts.userId, userId),
      });
      if (!cart) {
        const [created] = await tx.insert(carts).values({ userId }).returning();
        cart = created;
      } else {
        await tx
          .update(carts)
          .set({ updatedAt: new Date() })
          .where(eq(carts.id, cart.id));
      }

      await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));
      if (validated.items.length > 0) {
        await tx.insert(cartItems).values(
          validated.items.map((item) => ({
            cartId: cart.id,
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        );
      }
    });

    return validated;
  }
}
