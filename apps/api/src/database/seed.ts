import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as schema from './schema/index.js';

dotenv.config({ path: '../../.env' });
dotenv.config({ path: '../.env' });
dotenv.config();

async function seed() {
  console.log('🌱 Bắt đầu gieo dữ liệu mẫu (Seed Data) cho Neut-Studio...');

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  try {
    // 1. Tạo tài khoản mẫu
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const customerPassword = await bcrypt.hash('123456', salt);

    await db.insert(schema.users).values([
      {
        email: 'admin@neut.studio',
        passwordHash: adminPassword,
        fullName: 'Neut Studio Admin',
        role: 'ADMIN',
        phone: '0901112233',
      },
      {
        email: 'customer@neut.studio',
        passwordHash: customerPassword,
        fullName: 'Trần Streetwear',
        role: 'CUSTOMER',
        phone: '0909887766',
      },
    ]).onConflictDoNothing();

    console.log('[✓] Đã tạo tài khoản: admin@neut.studio (admin123) & customer@neut.studio (123456)');

    // 2. Tạo Danh mục (Categories)
    const [tops] = await db.insert(schema.categories).values({
      name: 'Tops',
      slug: 'tops',
      description: 'Áo thun, sơ mi, hoodie và áo khoác thời trang đường phố',
      sortOrder: 1,
    }).onConflictDoNothing().returning();

    const [bottoms] = await db.insert(schema.categories).values({
      name: 'Bottoms',
      slug: 'bottoms',
      description: 'Quần dài, quần short, quần jeans ống rộng',
      sortOrder: 2,
    }).onConflictDoNothing().returning();

    const [accessories] = await db.insert(schema.categories).values({
      name: 'Accessories',
      slug: 'accessories',
      description: 'Nón, phụ kiện, ví, dép slide',
      sortOrder: 3,
    }).onConflictDoNothing().returning();

    const [bags] = await db.insert(schema.categories).values({
      name: 'Bags',
      slug: 'bags',
      description: 'Balo, túi đeo chéo, bowler bags',
      sortOrder: 4,
    }).onConflictDoNothing().returning();

    console.log('[✓] Đã tạo các danh mục: Tops, Bottoms, Accessories, Bags');

    // 3. Tạo Bộ sưu tập (Collections)
    await db.insert(schema.collections).values([
      {
        name: 'The Rolling Stones x DirtyCoins',
        slug: 'rolling-stones',
        description: 'Bộ sưu tập hợp tác đặc biệt kết hợp biểu tượng nhạc Rock kinh điển',
        isCollab: true,
      },
      {
        name: 'Dragon Ball Z x DirtyCoins',
        slug: 'dragon-ball-z',
        description: 'Chiến dịch Streetwear lấy cảm hứng từ thế giới Dragon Ball Z',
        isCollab: true,
      },
      {
        name: 'DICO All-Star',
        slug: 'dico-all-star',
        description: 'Dòng sản phẩm di sản biểu tượng của DirtyCoins',
        isCollab: false,
      },
    ]).onConflictDoNothing();

    console.log('[✓] Đã tạo các bộ sưu tập Collab & DICO');

    // 4. Tạo Cửa hàng vật lý (Stores)
    const storeRecords = await db.insert(schema.stores).values([
      {
        name: 'Neut-Studio 561 Sư Vạn Hạnh',
        address: '561 Sư Vạn Hạnh, Phường 13, Quận 10',
        city: 'TP. Hồ Chí Minh',
        phone: '0901234501',
      },
      {
        name: 'Neut-Studio Vincom Đồng Khởi',
        address: 'Tầng B1-06 Vincom Center, 72 Lê Thánh Tôn, Bến Nghé, Quận 1',
        city: 'TP. Hồ Chí Minh',
        phone: '0901234502',
      },
      {
        name: 'Neut-Studio 180 Đ. La Thành',
        address: '180 Đ. La Thành, Ô Chợ Dừa, Đống Đa',
        city: 'Hà Nội',
        phone: '0901234503',
      },
      {
        name: 'Neut-Studio Aeon Mall Lê Chân',
        address: 'Tầng 1 Aeon Mall Lê Chân, Kênh Dương',
        city: 'Hải Phòng',
        phone: '0901234504',
      },
    ]).onConflictDoNothing().returning();

    console.log('[✓] Đã tạo danh sách 4 chi nhánh cửa hàng tại TP.HCM, Hà Nội, Hải Phòng');

    // 5. Tạo Sản phẩm & Biến thể mẫu (Products & Variants)
    // SP 1: Áo Thun DCxAB Battle Overprint
    const [p1] = await db.insert(schema.products).values({
      title: 'Áo Thun DCxAB Battle Overprint',
      slug: 'ao-thun-dcxab-battle-overprint',
      description: 'Chất liệu 100% Cotton 2 chiều dày dặn, định lượng 250gsm. Công nghệ in lụa tràn thân cao cấp.',
      materialAndCare: 'Giặt máy ở nhiệt độ thường với đồ cùng màu. Không dùng thuốc tẩy. Phơi trong bóng râm.',
      categoryId: tops ? tops.id : null,
      isPublished: true,
      isFeatured: true,
    }).onConflictDoNothing().returning();

    if (p1) {
      await db.insert(schema.productVariants).values([
        {
          productId: p1.id,
          sku: 'DCAB-TS-BLK-S',
          colorName: 'Black',
          colorHex: '#000000',
          size: 'S',
          price: 950000,
          stockQuantity: 15,
        },
        {
          productId: p1.id,
          sku: 'DCAB-TS-BLK-M',
          colorName: 'Black',
          colorHex: '#000000',
          size: 'M',
          price: 950000,
          stockQuantity: 20,
        },
        {
          productId: p1.id,
          sku: 'DCAB-TS-BLK-L',
          colorName: 'Black',
          colorHex: '#000000',
          size: 'L',
          price: 950000,
          stockQuantity: 8,
        },
        {
          productId: p1.id,
          sku: 'DCAB-TS-BLK-XL',
          colorName: 'Black',
          colorHex: '#000000',
          size: 'XL',
          price: 950000,
          stockQuantity: 0, // Hết hàng để test gạch size
        },
        {
          productId: p1.id,
          sku: 'DCAB-TS-WHT-M',
          colorName: 'White',
          colorHex: '#FFFFFF',
          size: 'M',
          price: 950000,
          stockQuantity: 12,
        },
        {
          productId: p1.id,
          sku: 'DCAB-TS-WHT-L',
          colorName: 'White',
          colorHex: '#FFFFFF',
          size: 'L',
          price: 950000,
          stockQuantity: 14,
        },
      ]).onConflictDoNothing();

      await db.insert(schema.productImages).values([
        {
          productId: p1.id,
          minioKey: 'products/sample-p1-front.jpg',
          imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
          colorAttached: 'Black',
          isCover: true,
          sortOrder: 1,
        },
        {
          productId: p1.id,
          minioKey: 'products/sample-p1-back.jpg',
          imageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80',
          colorAttached: 'Black',
          isCover: false,
          sortOrder: 2,
        },
      ]).onConflictDoNothing();
    }

    // SP 2: Áo Thun Casual T-shirt
    const [p2] = await db.insert(schema.products).values({
      title: 'Áo Thun Casual T-shirt',
      slug: 'ao-thun-casual-t-shirt',
      description: 'Mẫu áo thun trơn phom dáng Regular Fit chuẩn mực. Thích hợp mặc hàng ngày.',
      categoryId: tops ? tops.id : null,
      isPublished: true,
      isFeatured: true,
    }).onConflictDoNothing().returning();

    if (p2) {
      await db.insert(schema.productVariants).values([
        {
          productId: p2.id,
          sku: 'CASUAL-BLK-S',
          colorName: 'Black',
          colorHex: '#000000',
          size: 'S',
          price: 320000,
          stockQuantity: 25,
        },
        {
          productId: p2.id,
          sku: 'CASUAL-BLK-M',
          colorName: 'Black',
          colorHex: '#000000',
          size: 'M',
          price: 320000,
          stockQuantity: 30,
        },
        {
          productId: p2.id,
          sku: 'CASUAL-WHT-L',
          colorName: 'White',
          colorHex: '#FFFFFF',
          size: 'L',
          price: 320000,
          stockQuantity: 18,
        },
      ]).onConflictDoNothing();

      await db.insert(schema.productImages).values([
        {
          productId: p2.id,
          minioKey: 'products/sample-p2-front.jpg',
          imageUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80',
          colorAttached: 'Black',
          isCover: true,
          sortOrder: 1,
        },
      ]).onConflictDoNothing();
    }

    // SP 3: Quần Dài Denim Rivets Wide Leg
    const [p3] = await db.insert(schema.products).values({
      title: 'Quần Dài Denim Rivets Wide Leg',
      slug: 'quan-dai-denim-rivets-wide-leg',
      description: 'Quần Jeans ống rộng tán đinh kim loại nổi bật, xử lý wash bạc màu phong trần.',
      categoryId: bottoms ? bottoms.id : null,
      isPublished: true,
      isFeatured: true,
    }).onConflictDoNothing().returning();

    if (p3) {
      await db.insert(schema.productVariants).values([
        {
          productId: p3.id,
          sku: 'DENIM-WSH-28',
          colorName: 'Wash Denim',
          colorHex: '#4A6984',
          size: '28',
          price: 680000,
          stockQuantity: 10,
        },
        {
          productId: p3.id,
          sku: 'DENIM-WSH-30',
          colorName: 'Wash Denim',
          colorHex: '#4A6984',
          size: '30',
          price: 680000,
          stockQuantity: 15,
        },
        {
          productId: p3.id,
          sku: 'DENIM-WSH-32',
          colorName: 'Wash Denim',
          colorHex: '#4A6984',
          size: '32',
          price: 680000,
          stockQuantity: 12,
        },
      ]).onConflictDoNothing();

      await db.insert(schema.productImages).values([
        {
          productId: p3.id,
          minioKey: 'products/sample-p3-front.jpg',
          imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80',
          colorAttached: 'Wash Denim',
          isCover: true,
          sortOrder: 1,
        },
      ]).onConflictDoNothing();
    }

    // SP 4: Balo Denim Studs
    const [p4] = await db.insert(schema.products).values({
      title: 'Balo Denim Studs',
      slug: 'balo-denim-studs',
      description: 'Balo vải jean dày dặn phong cách Y2K, ngăn chứa rộng đựng vừa laptop 15.6 inch.',
      categoryId: bags ? bags.id : null,
      isPublished: true,
      isFeatured: true,
    }).onConflictDoNothing().returning();

    if (p4) {
      await db.insert(schema.productVariants).values([
        {
          productId: p4.id,
          sku: 'BAG-DENIM-FREE',
          colorName: 'Blue Denim',
          colorHex: '#2E5077',
          size: 'Freesize',
          price: 550000,
          stockQuantity: 20,
        },
      ]).onConflictDoNothing();

      await db.insert(schema.productImages).values([
        {
          productId: p4.id,
          minioKey: 'products/sample-p4-front.jpg',
          imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
          colorAttached: 'Blue Denim',
          isCover: true,
          sortOrder: 1,
        },
      ]).onConflictDoNothing();
    }

    // 6. Tạo mã giảm giá mẫu
    await db.insert(schema.coupons).values({
      code: 'NEUT10',
      discountType: 'PERCENT',
      discountValue: 10,
      maxDiscountAmount: 100000,
      minOrderAmount: 0,
      usageLimit: 500,
      usedCount: 0,
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      isActive: true,
    }).onConflictDoNothing();

    console.log('[✓] Đã tạo mã giảm giá chào mừng: NEUT10 (Giảm 10%, tối đa 100.000 VNĐ)');

    // 7. Tạo Đánh giá sản phẩm mẫu (Reviews kèm chiều cao, cân nặng, form dáng)
    const targetProduct = await db.query.products.findFirst({
      where: eq(schema.products.slug, 'ao-thun-dcxab-battle-overprint'),
    });

    if (targetProduct) {
      await db.insert(schema.productReviews).values([
        {
          productId: targetProduct.id,
          customerName: 'Hoàng Long (Streetwear Enthusiast)',
          rating: 5,
          fitScore: 0, // Chuẩn form
          userHeightCm: 174,
          userWeightKg: 66,
          purchasedSize: 'L',
          comment: 'Chất vải 100% cotton 250gsm siêu dày và đầm tay. Mình 1m74 66kg mang size L phủ qua mông tầm 5cm form rũ rất chuẩn DirtyCoins style, bo cổ kép 3cm không hề bị nhão sau 3 lần giặt.',
          images: [
            'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80',
          ],
          isVerifiedPurchase: true,
        },
        {
          productId: targetProduct.id,
          customerName: 'Minh Trí',
          rating: 5,
          fitScore: 1, // Rộng oversize
          userHeightCm: 168,
          userWeightKg: 58,
          purchasedSize: 'M',
          comment: 'Hình in lụa tráng gương bóng bẩy, sờ vào mịn không có cảm giác dính. Khuyên bạn nào gầy thích mặc vừa nên hạ 1 size, còn thích bơi trong áo oversize thì cứ đúng size mà lấy.',
          images: [],
          isVerifiedPurchase: true,
        },
        {
          productId: targetProduct.id,
          customerName: 'Quốc Bảo',
          rating: 4,
          fitScore: 0,
          userHeightCm: 180,
          userWeightKg: 78,
          purchasedSize: 'XL',
          comment: 'Giao hàng hỏa tốc trong 2 tiếng tại nội thành HCM. Đóng gói hộp carton chắc chắn kèm tag mác cao cấp.',
          images: [],
          isVerifiedPurchase: true,
        },
      ]).onConflictDoNothing();
      console.log('[✓] Đã gieo đánh giá mẫu kèm thông số fit cho Áo Thun DCxAB');
    }

    console.log('🎉 Gieo dữ liệu mẫu hoàn tất thành công 100%!');
  } catch (err: any) {
    console.error('Lỗi khi seed data:', err.message);
  } finally {
    await pool.end();
  }
}

seed();
