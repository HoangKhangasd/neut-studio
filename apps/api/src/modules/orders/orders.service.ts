import { Injectable, ConflictException, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { eq, sql, desc, and, inArray } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.module.js';
import {
  orders,
  orderItems,
  productVariants,
  products,
  coupons,
  couponUsages,
} from '../../database/schema/index.js';
import { CreateOrderDto, AdminOrderQueryDto } from './dto/orders.dto.js';

@Injectable()
export class OrdersService {
  constructor(@Inject(DRIZZLE) private readonly db: any) {}

  async createOrder(dto: CreateOrderDto, userId?: string) {
    if (!dto.items || dto.items.length === 0) {
      throw new ConflictException('Đơn hàng không có sản phẩm');
    }

    // Run inside ACID Transaction
    return this.db.transaction(async (tx: any) => {
      let subtotal = 0;
      const orderItemsToInsert: any[] = [];

      for (const item of dto.items) {
        if (item.quantity <= 0) {
          throw new ConflictException('Số lượng sản phẩm không hợp lệ');
        }

        // 1. Atomic decrement with condition
        const updated = await tx
          .update(productVariants)
          .set({
            stockQuantity: sql`${productVariants.stockQuantity} - ${item.quantity}`,
          })
          .where(
            and(
              eq(productVariants.id, item.variantId),
              sql`${productVariants.stockQuantity} >= ${item.quantity}`,
            ),
          )
          .returning();

        if (updated.length === 0) {
          throw new ConflictException(
            `Rất tiếc! Một trong các sản phẩm bạn chọn vừa hết hàng hoặc không đủ số lượng trong kho.`,
          );
        }

        const variant = updated[0];

        // Fetch parent product for title snapshot
        const prod = await tx.query.products.findFirst({
          where: eq(products.id, variant.productId),
        });

        const unitPrice = variant.salePrice || variant.price;
        const itemTotal = unitPrice * item.quantity;
        subtotal += itemTotal;

        orderItemsToInsert.push({
          variantId: variant.id,
          productTitle: prod ? prod.title : 'Sản phẩm thời trang',
          variantSku: variant.sku,
          variantColor: variant.colorName,
          variantSize: variant.size,
          unitPrice,
          quantity: item.quantity,
          totalPrice: itemTotal,
        });
      }

      // Check discount coupon
      let discountAmount = 0;
      if (dto.couponCode?.trim()) {
        const code = dto.couponCode.trim().toUpperCase();
        const coupon = await tx.query.coupons.findFirst({
          where: and(eq(coupons.code, code), eq(coupons.isActive, true)),
        });

        if (coupon && coupon.usedCount < coupon.usageLimit) {
          if (coupon.discountType === 'PERCENT') {
            discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
            if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
              discountAmount = coupon.maxDiscountAmount;
            }
          } else {
            discountAmount = coupon.discountValue;
          }

          // Update coupon usage
          await tx
            .update(coupons)
            .set({ usedCount: sql`${coupons.usedCount} + 1` })
            .where(eq(coupons.id, coupon.id));
        }
      }

      const shippingFee = subtotal >= 1000000 ? 0 : 30000; // Freeship for orders >= 1,000,000 VND
      const totalAmount = Math.max(0, subtotal + shippingFee - discountAmount);

      // Generate human-friendly order code
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const random4 = Math.floor(1000 + Math.random() * 9000);
      const orderCode = `NEUT-${dateStr}-${random4}`;

      // Insert Order record
      const [newOrder] = await tx
        .insert(orders)
        .values({
          orderCode,
          userId: userId || dto.userId || null,
          customerName: dto.customerName,
          customerPhone: dto.customerPhone,
          customerEmail: dto.customerEmail,
          shippingAddress: dto.shippingAddress,
          subtotal,
          shippingFee,
          discountAmount,
          totalAmount,
          paymentMethod: dto.paymentMethod,
          paymentStatus: dto.paymentMethod === 'COD' ? 'PENDING' : 'PENDING',
          orderStatus: 'PENDING',
        })
        .returning();

      // Insert Order Items
      for (const itemRecord of orderItemsToInsert) {
        await tx.insert(orderItems).values({
          orderId: newOrder.id,
          ...itemRecord,
        });
      }

      return {
        ...newOrder,
        items: orderItemsToInsert,
      };
    });
  }

  async getMyOrders(userId: string) {
    const orderList = await this.db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));

    const results = [];
    for (const order of orderList) {
      const items = await this.db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));
      results.push({
        ...order,
        items,
      });
    }
    return results;
  }

  async trackOrder(orderCode: string) {
    const order = await this.db.query.orders.findFirst({
      where: eq(orders.orderCode, orderCode.toUpperCase().trim()),
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy thông tin đơn hàng này');
    }

    const items = await this.db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    return {
      ...order,
      items,
    };
  }

  async getAdminOrders(query?: AdminOrderQueryDto) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query?.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions: any[] = [];

    if (query?.status && query.status !== 'ALL') {
      conditions.push(eq(orders.orderStatus, query.status));
    }

    if (query?.search?.trim()) {
      const term = `%${query.search.trim()}%`;
      conditions.push(
        sql`(${orders.orderCode} ILIKE ${term} OR ${orders.customerName} ILIKE ${term} OR ${orders.customerPhone} ILIKE ${term})`,
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const orderList = await this.db
      .select()
      .from(orders)
      .where(whereClause)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    if (orderList.length === 0) {
      return { data: [], total: 0, page, totalPages: 0 };
    }

    const orderIds = orderList.map((o: any) => o.id);

    const items = await this.db
      .select()
      .from(orderItems)
      .where(inArray(orderItems.orderId, orderIds));

    const formattedOrders = orderList.map((ord: any) => {
      const ordItems = items.filter((item: any) => item.orderId === ord.id);
      return {
        ...ord,
        items: ordItems,
      };
    });

    const [{ count }] = await this.db
      .select({ count: sql`count(*)` })
      .from(orders)
      .where(whereClause);

    const total = Number(count);

    return {
      data: formattedOrders,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateOrderStatus(id: string, newStatus: string) {
    const ALLOWED_ORDER_TRANSITIONS: Record<string, string[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['SHIPPING', 'CANCELLED'],
      SHIPPING: ['COMPLETED', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: [],
    };

    return this.db.transaction(async (tx: any) => {
      const [currentOrder] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, id));

      if (!currentOrder) {
        throw new NotFoundException('Không tìm thấy đơn hàng');
      }

      const currentStatus = currentOrder.orderStatus;
      const allowed = ALLOWED_ORDER_TRANSITIONS[currentStatus] || [];

      if (!allowed.includes(newStatus)) {
        throw new BadRequestException(
          `Không thể chuyển trạng thái đơn hàng từ '${currentStatus}' sang '${newStatus}'. Trạng thái hợp lệ: ${allowed.length ? allowed.join(', ') : 'Không có (đơn hàng đã kết thúc)'}`,
        );
      }

      // If cancelling, restore inventory to product_variants
      if (newStatus === 'CANCELLED' && currentStatus !== 'CANCELLED') {
        const items = await tx
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, id));

        for (const item of items) {
          if (item.variantId) {
            await tx
              .update(productVariants)
              .set({
                stockQuantity: sql`${productVariants.stockQuantity} + ${item.quantity}`,
                updatedAt: new Date(),
              })
              .where(eq(productVariants.id, item.variantId));
          }
        }
      }

      const [updated] = await tx
        .update(orders)
        .set({ orderStatus: newStatus, updatedAt: new Date() })
        .where(eq(orders.id, id))
        .returning();

      return updated;
    });
  }
}
