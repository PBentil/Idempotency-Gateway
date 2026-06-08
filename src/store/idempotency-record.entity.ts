import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";
import { IdempotencyStatus } from "./idempotency-status.enum";

@Entity('idempotency_records')
export class IdempotencyRecord {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    idempotencyKey: string;

    @Column()
    bodyHash: string;

    @Column({
        type: 'varchar',
        default: IdempotencyStatus.PENDING,
    })
    status: IdempotencyStatus;

    @Column({ nullable: true })
    statusCode: number;

    @Column({ type: 'varchar', nullable: true })
    transactionId: string;

    @Column({ type: 'float',nullable: true })
    amount: number;

    @Column({type: "varchar", nullable: true })
    currency: string;

    @Column({ type: 'varchar', nullable: true })
    processedAt: string;

    @CreateDateColumn()
    createdAt: Date;
}