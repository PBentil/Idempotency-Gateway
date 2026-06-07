import { Injectable } from '@nestjs/common';
import { ProcessPaymentDto } from "./payment.dto";
import * as crypto from 'crypto';

@Injectable()
export class PaymentService {
    async processPayment(dto: ProcessPaymentDto) {
        await this.delay(2000);

        return {
            message: `Charged ${dto.amount} ${dto.currency}`,
            transactionId: crypto.randomUUID(),
            amount: dto.amount,
            currency: dto.currency,
            processedAt: new Date().toISOString(),
        };
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}