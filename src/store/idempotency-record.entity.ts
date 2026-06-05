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

    @Column({ type: 'simple-json', nullable: true })
    responseBody: Record<string, any>;

    @CreateDateColumn()
    createdAt: Date;

    @Column({ type: 'varchar' })
    expiresAt: string;
}