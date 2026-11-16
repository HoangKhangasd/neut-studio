import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.module.js';
import { stores, storeInventories, newsletterLeads } from '../../database/schema/index.js';

@Injectable()
export class StoresService {
  constructor(@Inject(DRIZZLE) private readonly db: any) {}

  async getStores() {
    return this.db.select().from(stores).where(eq(stores.isActive, true));
  }

  async getStoreInventory(variantId: string) {
    const allStores = await this.db.select().from(stores).where(eq(stores.isActive, true));

    const inventories = await this.db
      .select()
      .from(storeInventories)
      .where(eq(storeInventories.variantId, variantId));

    return allStores.map((st: any) => {
      const inv = inventories.find((i: any) => i.storeId === st.id);
      return {
        ...st,
        stock: inv ? inv.stockQuantity : 0,
        inStock: inv ? inv.stockQuantity > 0 : false,
      };
    });
  }

  async subscribePhone(phone: string) {
    const cleanPhone = phone.trim();
    const existing = await this.db.query.newsletterLeads.findFirst({
      where: eq(newsletterLeads.phone, cleanPhone),
    });

    if (existing) {
      const existingCode = existing.discountCodeSent || 'NEUT10';
      return {
        success: true,
        message: 'Số điện thoại này đã được nhận mã giảm giá 10% trước đó.',
        code: existingCode,
        coupon: existingCode,
        couponCode: existingCode,
      };
    }

    const code = 'NEUT10';
    await this.db.insert(newsletterLeads).values({
      phone: cleanPhone,
      discountCodeSent: code,
    });

    return {
      success: true,
      message: 'Cám ơn bạn đã đăng ký! Mã giảm giá 10% của bạn là NEUT10.',
      code,
      coupon: code,
      couponCode: code,
    };
  }
}
