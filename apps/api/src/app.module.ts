import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module.js';
import { RedisModule } from './modules/redis/redis.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { StorageModule } from './modules/storage/storage.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ProductsModule } from './modules/products/products.module.js';
import { StoresModule } from './modules/stores/stores.module.js';
import { OrdersModule } from './modules/orders/orders.module.js';
import { CouponsModule } from './modules/coupons/coupons.module.js';
import { PaymentsModule } from './modules/payments/payments.module.js';
import { AccountModule } from './modules/account/account.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '../.env', '.env'],
    }),
    DatabaseModule,
    RedisModule,
    NotificationsModule,
    StorageModule,
    AuthModule,
    ProductsModule,
    StoresModule,
    OrdersModule,
    CouponsModule,
    PaymentsModule,
    AccountModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
