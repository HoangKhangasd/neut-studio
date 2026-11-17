import { Injectable, ConflictException, NotFoundException, BadRequestException, Inject, Optional } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { eq, sql, desc, and, or, isNull, lt, inArray } from 'drizzle-orm';
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
import { NotificationsService } from '../notifications/notifications.service.js';

function maskPhone(phone: string): string {
  const clean = phone.trim();
  if (clean.length <= 6) return '***';
  return `${clean.slice(0, 3)}****${clean.slice(-3)}`;
}

function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return '***';
  const [local, domain] = parts;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

@Injectable()
export class OrdersService {
  constructor(
    @Inject(DRIZZLE) private readonly db: any,
    @Optional() private readonly notifications?: NotificationsService,
  ) {}

  async createOrder(dto: CreateOrderDto, userId?: string) {
    if (!dto.items || dto.items.length === 0) {
      throw new ConflictException('Đơn hàng không có sản phẩm');
    }

    const authenticatedUserId = userId || null;

    // Run inside ACID Transaction
    return this.db.transaction(async (tx: any) => {
      let subtotal = 0;
      const orderItemsToInsert: any[] = [];

      for (const item of dto.items) {
        if (item.quantity <= 0) {
          throw new ConflictException('Số lượng sản phẩm không hợp lệ');
        }

        // 1. Atomic decrement with non-deleted variant condition
        const updated = await tx
          .update(productVariants)
          .set({
            stockQuantity: sql`${productVariants.stockQuantity} - ${item.quantity}`,
          })
          .where(
            and(
              eq(productVariants.id, item.variantId),
              isNull(productVariants.deletedAt),
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

        // Fetch parent product and verify it is published and not soft-deleted
        const prod = await tx.query.products.findFirst({
          where: eq(products.id, variant.productId),
        });

        if (!prod || !prod.isPublished || prod.deletedAt) {
          throw new ConflictException(
            'Sản phẩm bạn chọn hiện không còn mở bán trên hệ thống.',
          );
        }

        const unitPrice = variant.salePrice ?? variant.price;
        const itemTotal = unitPrice * item.quantity;
        subtotal += itemTotal;

        orderItemsToInsert.push({
          variantId: variant.id,
          productTitle: prod.title,
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
      let appliedCoupon: any = null;
      if (dto.couponCode?.trim()) {
        const code = dto.couponCode.trim().toUpperCase();
        const coupon = await tx.query.coupons.findFirst({
          where: eq(coupons.code, code),
        });

        if (!coupon || !coupon.isActive) {
          throw new BadRequestException('Mã giảm giá không tồn tại hoặc đã bị vô hiệu hóa');
        }

        const now = new Date();
        if (coupon.startDate && new Date(coupon.startDate) > now) {
          throw new BadRequestException('Mã giảm giá chưa đến thời gian áp dụng');
        }
        if (coupon.endDate && new Date(coupon.endDate) < now) {
          throw new BadRequestException('Mã giảm giá đã hết hạn sử dụng');
        }
        if (
          coupon.usageLimit !== null &&
          coupon.usageLimit !== undefined &&
          coupon.usedCount >= coupon.usageLimit
        ) {
          throw new BadRequestException('Mã giảm giá đã hết lượt sử dụng');
        }
        if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
          throw new BadRequestException(
            `Đơn hàng chưa đạt giá trị tối thiểu ${Number(coupon.minOrderAmount).toLocaleString('vi-VN')} VND để sử dụng mã này`,
          );
        }

        if (authenticatedUserId) {
          const existingUsage = await tx.query.couponUsages.findFirst({
            where: and(
              eq(couponUsages.couponId, coupon.id),
              eq(couponUsages.userId, authenticatedUserId),
            ),
          });
          if (existingUsage) {
            throw new BadRequestException('Bạn đã sử dụng mã giảm giá này trước đó');
          }
        }

        if (coupon.discountType === 'PERCENT') {
          discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
          if (
            coupon.maxDiscountAmount !== null &&
            coupon.maxDiscountAmount !== undefined &&
            discountAmount > Number(coupon.maxDiscountAmount)
          ) {
            discountAmount = Number(coupon.maxDiscountAmount);
          }
        } else {
          discountAmount = Math.min(subtotal, Number(coupon.discountValue));
        }

        // Update coupon usage atomically (NULL-safe for unlimited coupons)
        const [updatedCoupon] = await tx
          .update(coupons)
          .set({ usedCount: sql`${coupons.usedCount} + 1` })
          .where(
            and(
              eq(coupons.id, coupon.id),
              or(isNull(coupons.usageLimit), lt(coupons.usedCount, coupons.usageLimit)),
            ),
          )
          .returning();

        if (!updatedCoupon) {
          throw new BadRequestException('Mã giảm giá vừa hết lượt sử dụng');
        }
        appliedCoupon = updatedCoupon;
      }

      const shippingFee = subtotal >= 1000000 ? 0 : 30000; // Freeship for orders >= 1,000,000 VND
      const totalAmount = Math.max(0, subtotal + shippingFee - discountAmount);

      // Validate payment method
      const paymentMethod = dto.paymentMethod || 'COD';
      if (paymentMethod !== 'COD' && paymentMethod !== 'PAYOS') {
        throw new BadRequestException('Hiện tại hệ thống hỗ trợ thanh toán COD hoặc chuyển khoản VietQR (PAYOS)');
      }

      const expiresAt =
        paymentMethod === 'PAYOS' ? new Date(Date.now() + 15 * 60 * 1000) : null;

      // Generate high-entropy order code with SAVEPOINT retry on rare unique collision
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const runAttempt =
        typeof tx.transaction === 'function'
          ? (fn: (subTx: any) => Promise<any>) => tx.transaction(fn)
          : (fn: (subTx: any) => Promise<any>) => fn(tx);

      let newOrder: any;
      for (let attempt = 0; attempt < 3; attempt++) {
        const orderCode = `NEUT-${dateStr}-${randomBytes(4).toString('hex').toUpperCase()}`;
        try {
          newOrder = await runAttempt(async (subTx) => {
            const [inserted] = await subTx
              .insert(orders)
              .values({
                orderCode,
                userId: authenticatedUserId,
                couponId: appliedCoupon ? appliedCoupon.id : null,
                couponCode: appliedCoupon ? appliedCoupon.code : null,
                customerName: dto.customerName,
                customerPhone: dto.customerPhone,
                customerEmail: dto.customerEmail,
                shippingAddress: dto.shippingAddress,
                subtotal,
                shippingFee,
                discountAmount,
                totalAmount,
                paymentMethod,
                paymentStatus: 'PENDING',
                orderStatus: 'PENDING',
                expiresAt,
              })
              .returning();
            return inserted;
          });
          break;
        } catch (err: any) {
          if (err?.code === '23505' && attempt < 2) {
            continue;
          }
          throw err;
        }
      }

      // Insert Order Items
      for (const itemRecord of orderItemsToInsert) {
        await tx.insert(orderItems).values({
          orderId: newOrder.id,
          ...itemRecord,
        });
      }

      if (appliedCoupon && authenticatedUserId) {
        await tx.insert(couponUsages).values({
          couponId: appliedCoupon.id,
          userId: authenticatedUserId,
          orderId: newOrder.id,
        });
      }

      return {
        ...newOrder,
        items: orderItemsToInsert,
      };
    }).then(async (createdOrder: any) => {
      if (createdOrder?.customerEmail) {
        this.notifications
          ?.sendOrderConfirmation({
            to: createdOrder.customerEmail,
            orderCode: createdOrder.orderCode,
            customerName: createdOrder.customerName,
            totalAmount: createdOrder.totalAmount,
            paymentMethod: createdOrder.paymentMethod,
          })
          .catch(() => {});
      }
      if (createdOrder?.paymentMethod === 'PAYOS') {
        this.notifications
          ?.scheduleOrderExpiry(createdOrder.id, createdOrder.orderCode)
          .catch(() => {});
      }
      return createdOrder;
    });
  }

  async getMyOrders(userId: string) {
    const orderList = await this.db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));

    if (orderList.length === 0) {
      return [];
    }

    const orderIds = orderList.map((o: any) => o.id);
    const items = await this.db
      .select()
      .from(orderItems)
      .where(inArray(orderItems.orderId, orderIds));

    return orderList.map((order: any) => ({
      ...order,
      items: items.filter((item: any) => item.orderId === order.id),
    }));
  }

  async trackOrder(
    orderCode: string,
    phone?: string,
    currentUser?: { id: string; role: string },
  ) {
    const code = orderCode.toUpperCase().trim();
    const order = await this.db.query.orders.findFirst({
      where: eq(orders.orderCode, code),
    });

    const isPrivilegedOwner =
      !!currentUser &&
      !!order &&
      (currentUser.role === 'ADMIN' || (!!order.userId && order.userId === currentUser.id));

    if (!isPrivilegedOwner) {
      if (!phone || !phone.trim()) {
        throw new BadRequestException('Vui lòng nhập số điện thoại đặt hàng để tra cứu');
      }
      if (!order || order.customerPhone.trim() !== phone.trim()) {
        throw new NotFoundException(
          'Không tìm thấy đơn hàng với mã đơn và số điện thoại đã nhập',
        );
      }
    } else if (!order) {
      throw new NotFoundException('Không tìm thấy thông tin đơn hàng này');
    }

    const items = await this.db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    if (isPrivilegedOwner) {
      return {
        ...order,
        items,
      };
    }

    const maskedAddress =
      order.shippingAddress && typeof order.shippingAddress === 'object'
        ? { ...order.shippingAddress, street: '***' }
        : '***';

    return {
      ...order,
      customerPhone: maskPhone(order.customerPhone),
      customerEmail: maskEmail(order.customerEmail),
      shippingAddress: maskedAddress,
      items,
    };
  }

  async getAdminOrders(query?: AdminOrderQueryDto) {
    const page = Math.max(1, Math.floor(Number(query?.page)) || 1);
    const limit = Math.max(1, Math.min(100, Math.floor(Number(query?.limit)) || 10));
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

    const [{ count }] = await this.db
      .select({ count: sql`count(*)` })
      .from(orders)
      .where(whereClause);

    const total = Number(count);
    const totalPages = Math.ceil(total / limit);

    const orderList = await this.db
      .select()
      .from(orders)
      .where(whereClause)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    if (orderList.length === 0) {
      return { data: [], total, page, totalPages };
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

    return {
      data: formattedOrders,
      total,
      page,
      totalPages,
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

      // Conditional atomic transition prevents concurrent double-cancel / double stock restore
      const [updated] = await tx
        .update(orders)
        .set({ orderStatus: newStatus, updatedAt: new Date() })
        .where(and(eq(orders.id, id), eq(orders.orderStatus, currentStatus)))
        .returning();

      if (!updated) {
        throw new ConflictException('Trạng thái đơn hàng đã thay đổi, vui lòng tải lại');
      }

      // Only after atomic transition succeeds: restore inventory and roll back coupon usage
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

        if (currentOrder.couponId) {
          await tx
            .update(coupons)
            .set({
              usedCount: sql`GREATEST(0, ${coupons.usedCount} - 1)`,
            })
            .where(eq(coupons.id, currentOrder.couponId));

          await tx.delete(couponUsages).where(eq(couponUsages.orderId, id));
        }
      }

      return updated;
    });
  }

  async getAdminStats() {
    const [orderAgg] = await this.db
      .select({
        totalOrders: sql<number>`count(*)`,
        cancelledOrders: sql<number>`count(*) FILTER (WHERE ${orders.orderStatus} = 'CANCELLED')`,
        pendingOrders: sql<number>`count(*) FILTER (WHERE ${orders.orderStatus} = 'PENDING')`,
        totalRevenue: sql<number>`COALESCE(SUM(${orders.totalAmount}) FILTER (WHERE ${orders.orderStatus} <> 'CANCELLED'), 0)`,
      })
      .from(orders);

    const [prodAgg] = await this.db
      .select({ totalProducts: sql<number>`count(*)` })
      .from(products)
      .where(isNull(products.deletedAt));

    const lowStockRows = await this.db
      .select({
        productId: products.id,
        productTitle: products.title,
        variantId: productVariants.id,
        size: productVariants.size,
        colorName: productVariants.colorName,
        stockQuantity: productVariants.stockQuantity,
      })
      .from(productVariants)
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(
        and(
          isNull(products.deletedAt),
          isNull(productVariants.deletedAt),
          lt(productVariants.stockQuantity, 5),
        ),
      )
      .orderBy(productVariants.stockQuantity);

    return {
      totalRevenue: Number(orderAgg?.totalRevenue || 0),
      totalOrders: Number(orderAgg?.totalOrders || 0),
      cancelledOrders: Number(orderAgg?.cancelledOrders || 0),
      pendingOrders: Number(orderAgg?.pendingOrders || 0),
      totalProducts: Number(prodAgg?.totalProducts || 0),
      lowStockItems: lowStockRows,
    };
  }
}
