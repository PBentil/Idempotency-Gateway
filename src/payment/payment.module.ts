import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import {TypeOrmModule} from "@nestjs/typeorm";
import {IdempotencyRecord} from "../store/idempotency-record.entity";

@Module({
  imports: [TypeOrmModule.forFeature([IdempotencyRecord])],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
