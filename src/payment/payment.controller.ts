import {Body, Controller, HttpCode, HttpStatus, Post, Req} from '@nestjs/common';
import { PaymentService } from './payment.service';
import {ProcessPaymentDto} from "./payment.dto";

@Controller()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('process-payment')
  @HttpCode(HttpStatus.CREATED)
  async processPayment(@Body() dto: ProcessPaymentDto){
    return await this.paymentService.processPayment(dto);
  }
}
