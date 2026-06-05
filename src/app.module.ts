import {MiddlewareConsumer, Module, NestModule, RequestMethod} from '@nestjs/common';
import { PaymentModule } from './payment/payment.module';
import {ConfigModule, ConfigService} from "@nestjs/config";
import {TypeOrmModule} from "@nestjs/typeorm";
import {StoreModule} from "./store/store.module";
import {IdempotencyMiddleware} from "./middleware/idempotency.middleware";
import {IdempotencyRecord} from "./store/idempotency-record.entity";

@Module({
  imports: [
      ConfigModule.forRoot({
        isGlobal: true,
      }),
      TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: 'database.sqlite3',
          entities: [IdempotencyRecord],
          synchronize: true,
        }),
      PaymentModule,
      StoreModule,
  ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(IdempotencyMiddleware)
            .forRoutes({ path : 'process-payment', method: RequestMethod.POST });
    }
}
