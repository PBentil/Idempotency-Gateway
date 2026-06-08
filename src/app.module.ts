import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PaymentModule } from './payment/payment.module';
import { StoreModule } from './store/store.module';
import { IdempotencyMiddleware } from './middleware/idempotency.middleware';
import { IdempotencyRecord } from './store/idempotency-record.entity';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),

        TypeOrmModule.forRoot({
            type: 'better-sqlite3',
            database: 'database.sqlite3',
            entities: [IdempotencyRecord],
            synchronize: true,
        }),

        ThrottlerModule.forRoot([{
            ttl: 60000,
            limit: 10,
        }]),

        StoreModule,
        PaymentModule,
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(IdempotencyMiddleware)
            .forRoutes({ path: 'process-payment', method: RequestMethod.POST });
    }
}