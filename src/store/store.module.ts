import {Module} from "@nestjs/common";
import {TypeOrmModule} from "@nestjs/typeorm";
import {IdempotencyRecord} from "./idempotency-record.entity";
import {IdempotencyStore} from "./idempotency-store";


@Module({
    imports: [TypeOrmModule.forFeature([IdempotencyRecord])],
    providers: [IdempotencyStore],
    exports: [IdempotencyStore],
})

export class StoreModule {}