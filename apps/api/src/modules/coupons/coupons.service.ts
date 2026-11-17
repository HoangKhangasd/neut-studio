import { Injectable, Inject, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { desc, eq, ilike, sql } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.module.js';
import { coupons, newsletterLeads } from '../../database/schema/index.js';
import {
  ValidateCouponDto,
  AdminCouponQueryDto,
  CreateCouponDto,
  UpdateCouponDto,
} from './dto/validate-coupon.dto.js';

@Injectable()
export class CouponsService {
  constructor(@Inject(DRIZZLE) private readonly db: any) {}

  async validateCoupon(dto: ValidateCouponDto) {
    const code = dto.code.trim().toUpperCase();
    const subtotal = Number(dto.subtotal) || 0;

    const coupon = await this.db.query.coupons.findFirst({
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

    let discountAmount = 0;
    if (coupon.discountType === 'PERCENT') {
      discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscountAmount && discountAmount > Number(coupon.maxDiscountAmount)) {
        discountAmount = Number(coupon.maxDiscountAmount);
      }
    } else {
      discountAmount = Math.min(subtotal, Number(coupon.discountValue));
    }

    return {
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscountAmount: coupon.maxDiscountAmount,
      minOrderAmount: coupon.minOrderAmount,
      discountAmount,
      message: `Áp dụng mã ${coupon.code} thành công! Giảm ${discountAmount.toLocaleString('vi-VN')} VND`,
    };
  }

  async subscribeNewsletter(phone: string) {
    if (!phone || !phone.trim()) {
      throw new BadRequestException('Vui lòng cung cấp số điện thoại');
    }
    const cleanPhone = phone.trim();

    const activeCoupon = await this.db.query.coupons.findFirst({
      where: eq(coupons.isActive, true),
    });
    const couponCode = activeCoupon ? activeCoupon.code : 'NEUT10';

    try {
      await this.db
        .insert(newsletterLeads)
        .values({
          phone: cleanPhone,
          discountCodeSent: couponCode,
        })
        .onConflictDoUpdate({
          target: newsletterLeads.phone,
          set: { discountCodeSent: couponCode },
        });
    } catch {}

    return {
      success: true,
      phone: cleanPhone,
      coupon: couponCode,
      couponCode: couponCode,
      code: couponCode,
      message: 'Đăng ký thành công',
    };
  }

  // ===================== ADMIN COUPONS CRUD =====================
  async getAdminCoupons(query?: AdminCouponQueryDto) {
    const page = Math.max(1, Math.floor(Number(query?.page)) || 1);
    const limit = Math.max(1, Math.min(100, Math.floor(Number(query?.limit)) || 10));
    const offset = (page - 1) * limit;

    const whereClause = query?.search?.trim()
      ? ilike(coupons.code, `%${query.search.trim()}%`)
      : undefined;

    const [{ count }] = await this.db
      .select({ count: sql`count(*)` })
      .from(coupons)
      .where(whereClause);

    const total = Number(count);
    const totalPages = Math.ceil(total / limit);

    const data = await this.db
      .select()
      .from(coupons)
      .where(whereClause)
      .orderBy(desc(coupons.createdAt))
      .limit(limit)
      .offset(offset);

    return { data, total, page, totalPages };
  }

  async createCoupon(dto: CreateCouponDto) {
    const code = dto.code.trim().toUpperCase();
    const existing = await this.db.query.coupons.findFirst({
      where: eq(coupons.code, code),
    });
    if (existing) {
      throw new ConflictException(`Mã giảm giá '${code}' đã tồn tại`);
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    const endDate = new Date(dto.endDate);
    if (endDate <= startDate) {
      throw new BadRequestException('Ngày hết hạn phải lớn hơn ngày bắt đầu');
    }
    if (dto.discountType === 'PERCENT' && dto.discountValue > 100) {
      throw new BadRequestException('Giảm giá theo phần trăm không được vượt quá 100%');
    }

    const [created] = await this.db
      .insert(coupons)
      .values({
        code,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        maxDiscountAmount: dto.maxDiscountAmount ?? null,
        minOrderAmount: dto.minOrderAmount ?? 0,
        usageLimit: dto.usageLimit ?? 100,
        startDate,
        endDate,
        isActive: dto.isActive ?? true,
      })
      .returning();

    return created;
  }

  async updateCoupon(id: string, dto: UpdateCouponDto) {
    const updateData: any = {};
    if (dto.discountType !== undefined) updateData.discountType = dto.discountType;
    if (dto.discountValue !== undefined) updateData.discountValue = dto.discountValue;
    if (dto.maxDiscountAmount !== undefined) updateData.maxDiscountAmount = dto.maxDiscountAmount;
    if (dto.minOrderAmount !== undefined) updateData.minOrderAmount = dto.minOrderAmount;
    if (dto.usageLimit !== undefined) updateData.usageLimit = dto.usageLimit;
    if (dto.endDate !== undefined) updateData.endDate = new Date(dto.endDate);
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    const [updated] = await this.db
      .update(coupons)
      .set(updateData)
      .where(eq(coupons.id, id))
      .returning();

    if (!updated) throw new NotFoundException('Không tìm thấy mã giảm giá');
    return updated;
  }

  async deleteCoupon(id: string) {
    const [deleted] = await this.db
      .delete(coupons)
      .where(eq(coupons.id, id))
      .returning({ id: coupons.id });

    if (!deleted) throw new NotFoundException('Không tìm thấy mã giảm giá để xóa');
    return { success: true, id };
  }
}
