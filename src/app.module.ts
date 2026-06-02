import {MiddlewareConsumer, Module, NestModule, RequestMethod} from '@nestjs/common';
import { PaymentModule } from './payment/payment.module';
import {ConfigModule, ConfigService} from "@nestjs/config";
import {TypeOrmModule} from "@nestjs/typeorm";
import {StoreModule} from "./store/store.module";
import {IdempotencyMiddleware} from "./middleware/idempotency.middleware";

@Module({
  imports: [
      ConfigModule.forRoot({
        isGlobal: true,
      }),
      TypeOrmModule.forRootAsync({
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          type: 'postgres',
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT'),
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_NAME'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true,
        }),
        inject: [ConfigService],
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
