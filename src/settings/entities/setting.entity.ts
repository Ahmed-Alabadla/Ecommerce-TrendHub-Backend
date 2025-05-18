import { CURRENT_TIMESTAMP } from 'src/utils/constants';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'settings' })
export class Setting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  store_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  store_email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  store_phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  store_address: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  store_logo: string;

  @Column({ type: 'decimal', precision: 4, scale: 2, default: 0.0 })
  tax_rate: number;

  @Column({ type: 'boolean', default: true })
  tax_enabled: boolean;

  @Column({ type: 'decimal', precision: 4, scale: 2, default: 0.0 })
  shipping_rate: number;

  @Column({ type: 'boolean', default: false })
  shipping_enabled: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => CURRENT_TIMESTAMP })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => CURRENT_TIMESTAMP,
    onUpdate: CURRENT_TIMESTAMP,
  })
  updatedAt: Date;
}
