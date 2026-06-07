import { BadRequestException, Injectable } from '@nestjs/common';
import { ProcessPaymentDto } from "./payment.dto";
import * as crypto from 'crypto';

@Injectable()
export class PaymentService {
    async processPayment(dto: ProcessPaymentDto) {
        this.validatePayload(dto);
        await this.delay(2000);

        return {
            message: `Charged ${dto.amount} ${dto.currency}`,
            transactionId: crypto.randomUUID(),
            amount: dto.amount,
            currency: dto.currency,
            processedAt: new Date().toISOString(),
        };
    }

    private validatePayload(dto: ProcessPaymentDto) {
        if (!dto.amount || dto.amount <= 0) {
            throw new BadRequestException('Amount must be a positive number');
        }
        if (!dto.currency || dto.currency.trim() === '') {
            throw new BadRequestException('Currency is required');
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}