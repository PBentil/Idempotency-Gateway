import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IdempotencyRecord } from "./idempotency-record.entity";
import { Repository } from "typeorm";
import * as crypto from "crypto";
import { IdempotencyStatus } from "./idempotency-status.enum";

interface CachedResponse {
    statusCode: number;
    responseBody: Record<string, any>;
    expiresAt: number;
}

@Injectable()
export class IdempotencyStore {

    private responseCache = new Map<string, CachedResponse>();

    private readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000;

    constructor(
        @InjectRepository(IdempotencyRecord)
        private readonly repo: Repository<IdempotencyRecord>,
    ) {}

    hashBody(body: Record<string, any>): string {
        return crypto
            .createHash('sha256')
            .update(JSON.stringify(body))
            .digest('hex');
    }

    getCachedResponse(key: string): CachedResponse | null {
        const cached = this.responseCache.get(key);
        if (!cached) return null;

        if (Date.now() > cached.expiresAt) {
            this.responseCache.delete(key);
            return null;
        }

        return cached;
    }

    rebuildResponse(record: IdempotencyRecord): CachedResponse {
        const responseBody = {
            message: `Charged ${record.amount} ${record.currency}`,
            transactionId: record.transactionId,
            amount: record.amount,
            currency: record.currency,
            processedAt: record.processedAt,
        };

        const cached: CachedResponse = {
            statusCode: record.statusCode,
            responseBody,
            expiresAt: Date.now() + this.CACHE_TTL_MS,
        };

        this.responseCache.set(record.idempotencyKey, cached);

        return cached;
    }

    async findByKey(key: string): Promise<IdempotencyRecord | null> {
        const record = await this.repo.findOne({
            where: { idempotencyKey: key },
        });

        if (!record) return null;

        const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
        if (
            record.status === IdempotencyStatus.PENDING &&
            record.createdAt < thirtySecondsAgo
        ) {
            await this.repo.delete(record.id);
            this.responseCache.delete(key);
            return null;
        }

        return record;
    }

    async setPending(key: string, bodyHash: string): Promise<void> {
        const record = this.repo.create({
            idempotencyKey: key,
            bodyHash,
            status: IdempotencyStatus.PENDING,
        });

        await this.repo.save(record);
    }

    async setComplete(
        key: string,
        statusCode: number,
        responseBody: Record<string, any>,
    ): Promise<void> {
        await this.repo.update(
            { idempotencyKey: key },
            {
                status: IdempotencyStatus.COMPLETED,
                statusCode,
                transactionId: responseBody.transactionId,
                amount: responseBody.amount,
                currency: responseBody.currency,
                processedAt: responseBody.processedAt,
            },
        );

        this.responseCache.set(key, {
            statusCode,
            responseBody,
            expiresAt: Date.now() + this.CACHE_TTL_MS,
        });
    }

    async waitForCompletion(
        key: string,
        timeoutMs = 10000,
    ): Promise<IdempotencyRecord | null> {
        const deadline = Date.now() + timeoutMs;

        while (Date.now() < deadline) {
            await new Promise((r) => setTimeout(r, 100));
            const record = await this.findByKey(key);
            if (!record) return null;
            if (record.status === IdempotencyStatus.COMPLETED) return record;
        }

        return null;
    }
}