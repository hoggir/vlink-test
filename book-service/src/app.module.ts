import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import databaseConfig from './config/database.config';
import authConfig from './config/auth.config';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './common/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BooksModule } from './modules/books/books.module';
import { CheckoutsModule } from './modules/checkouts/checkouts.module';
import { ReportsModule } from './modules/reports/reports.module';
import { CartModule } from './modules/cart/cart.module';
import { PublicBooksModule } from './modules/public-books/public-books.module';
import { CustomerCheckoutModule } from './modules/customer-checkout/customer-checkout.module';
import { ErrorLogsModule } from './modules/error-logs/error-logs.module';
import { HealthModule } from './modules/health/health.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard';
import { getMongoConfig } from './common/database/mongodb.config';
import { getBullConfig } from './common/database/bull.config';
import {
  ErrorLog,
  ErrorLogSchema,
} from './common/database/schemas/error-log.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, authConfig],
      envFilePath: ['.env'],
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getMongoConfig,
    }),
    MongooseModule.forFeature([
      { name: ErrorLog.name, schema: ErrorLogSchema },
    ]),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getBullConfig,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 10,
      },
    ]),
    DatabaseModule,
    RedisModule,
    HealthModule,
    AuthModule,
    UsersModule,
    BooksModule,
    CheckoutsModule,
    ReportsModule,
    CartModule,
    PublicBooksModule,
    CustomerCheckoutModule,
    ErrorLogsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule {}
