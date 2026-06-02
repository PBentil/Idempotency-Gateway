import {Column, CreateDateColumn, Entity, PrimaryGeneratedColumn} from "typeorm";
import {idempotencyStatus} from "./idempotency-status.enum";


@Entity('idempotency-record')
export class IdempotencyRecord {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({unique: true})
    idempotencyKey: string;

    @Column()
    bodyHash: string;

    @Column({type:'enum', enum: idempotencyStatus, default: idempotencyStatus.PENDING})
    status: idempotencyStatus;

    @Column({nullable:true})
    statusCode: number;

    @Column({type:'jsonb', nullable:true})
    responseBody: Record<string, any>;

    @CreateDateColumn()
    createdAt: Date;

    @Column({ type: 'timestamptz' })
    expiredAt: Date;
}