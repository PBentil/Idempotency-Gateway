import {
    HttpException,
    Injectable,
    NestMiddleware,
    UnprocessableEntityException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { IdempotencyStatus } from '../store/idempotency-status.enum';
import {IdempotencyStore} from "../store/idempotency-store";

@Injectable()
export class IdempotencyMiddleware implements NestMiddleware {

    constructor(private readonly store: IdempotencyStore) {}

    async use(req: Request, res: Response, next: NextFunction) {

        const idempotencyKey = req.headers['idempotency-key'] as string;

        if (!idempotencyKey) {
            throw new UnprocessableEntityException(
                'Missing required header: Idempotency-Key',
            );
        }

        const incomingHash = this.store.hashBody(req.body);
        const existing = await this.store.findByKey(idempotencyKey);

        if (existing) {

            if (existing.bodyHash !== incomingHash) {
                throw new HttpException(
                    {
                        statusCode: 422,
                        message: 'Idempotency key already used for a different request body.',
                    },
                    422,
                );
            }

            if (existing.status === IdempotencyStatus.PENDING) {
                const completed = await this.store.waitForCompletion(idempotencyKey);

                if (!completed) {
                    throw new HttpException(
                        {
                            statusCode: 503,
                            message: 'Original request is still processing. Please retry shortly.',
                        },
                        503,
                    );
                }

                const cached = this.store.getCachedResponse(idempotencyKey);
                const response = cached ?? this.store.rebuildResponse(completed);

                res.setHeader('X-Cache-Hit', 'true');
                res.setHeader('X-Cache-Source', cached ? 'memory' : 'database');
                return res.status(response.statusCode).json(response.responseBody);
            }

            if (existing.status === IdempotencyStatus.COMPLETED) {
                const cached = this.store.getCachedResponse(idempotencyKey);
                const response = cached ?? this.store.rebuildResponse(existing);

                res.setHeader('X-Cache-Hit', 'true');
                res.setHeader('X-Cache-Source', cached ? 'memory' : 'database');
                return res.status(response.statusCode).json(response.responseBody);
            }
        }

        await this.store.setPending(idempotencyKey, incomingHash);

        const originalJson = res.json.bind(res);
        res.json = (body: any) => {
            this.store.setComplete(idempotencyKey, res.statusCode, body);
            return originalJson(body);
        };

        next();
    }
}