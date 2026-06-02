import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {IdempotencyRecord} from "./idempotency-record.entity";
import {Repository} from "typeorm";
import * as crypto from "crypto";
import {idempotencyStatus} from "./idempotency-status.enum";


@Injectable()
export class IdempotencyStore {
    constructor(
        @InjectRepository(IdempotencyRecord)
        private readonly repo : Repository<IdempotencyRecord>,
    ) {}

    hashBody(body: Record<string, any>): string{
        return crypto
            .createHash('sha256')
            .update(JSON.stringify(body))
            .digest('hex');
    }

    async findByKey(key: string): Promise<IdempotencyRecord | null> {
        const record = await this.repo.findOne({
            where: { idempotencyKey: key}
        })

        if(!record) return null;

        if ( new Date() > record.expiredAt) {
            await this.repo.delete(record.id);
            return null
        }

        return record;
    }

    async setPending(key: string, bodyHash: string): Promise<void> {
        const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const record = this.repo.create({
            idempotencyKey: key,
            bodyHash,
            status: idempotencyStatus.PENDING,
            expiredAt
        });

        await this.repo.save(record);
    }
    async setCompleted(key: string, statusCode: number, responseBody: Record<string, any>) : Promise<void> {
        await this.repo.update(
            {idempotencyKey: key},
            {
                status: idempotencyStatus.COMPLETED,
                statusCode,
                responseBody
            }
        )
    }

    async waitForCompletion(key: string, timeoutMs = 10000) : Promise<IdempotencyRecord | null> {
        const deadline = Date.now() + timeoutMs;

        while (Date.now() < deadline) {
            await new Promise((r) => setTimeout(r, 100));
            const record = await this.findByKey(key);
            if (!record) return null;
            if (record.status === idempotencyStatus.COMPLETED) return null;
        }
        return null;
    }
}