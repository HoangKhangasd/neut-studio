import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.module.js';
import { coupons, newsletterLeads } from '../../database/schema/index.js';
import { ValidateCouponDto } from './dto/validate-coupon.dto.js';

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
}
