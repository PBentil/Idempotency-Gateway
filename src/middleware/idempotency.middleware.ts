import {
    HttpException,
    Injectable,
    NestMiddleware,
    UnprocessableEntityException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import {IdempotencyStore} from "../store/idempotency-store";
import {idempotencyStatus} from "../store/idempotency-status.enum";


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

            if (existing.status === idempotencyStatus.COMPLETED) {
                res.setHeader('X-Cache-Hit', 'true');
                return res.status(existing.statusCode).json(existing.responseBody);
            }
        }

        await this.store.setPending(idempotencyKey, incomingHash);

        const originalJson = res.json.bind(res);
        res.json = (body: any) => {
            this.store.setCompleted(idempotencyKey, res.statusCode, body);
            return originalJson(body);
        };

        next();
    }
}