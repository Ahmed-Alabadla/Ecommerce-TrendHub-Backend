import { Brand } from 'src/brands/entities/brand.entity';
import { Category } from 'src/categories/entities/category.entity';
import { SubCategory } from 'src/sub-categories/entities/sub-category.entity';
import { CURRENT_TIMESTAMP } from 'src/utils/constants';
import { ProductStatus } from 'src/utils/enums';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Dimensions } from './dimensions.entity';
import { Review } from 'src/reviews/entities/review.entity';

@Entity({ name: 'products' })
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({
    name: 'price_after_discount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  priceAfterDiscount: number;

  @Column({ name: 'image_cover' })
  imageCover: string;

  @Column('text', { array: true, default: () => 'ARRAY[]::text[]' })
  images: string[];

  @Column('text', { array: true, default: () => 'ARRAY[]::text[]' })
  colors: string[];

  @Column({ default: 0 })
  sold: number;

  @Column({
    name: 'ratings_average',
    type: 'decimal',
    precision: 3,
    scale: 1,
    default: 0,
  })
  ratingsAverage: number;

  @Column({ name: 'ratings_quantity', default: 0 })
  ratingsQuantity: number;

  @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.ACTIVE })
  status: string;

  @Column({ nullable: true })
  warranty: string; // "1 year manufacturer warranty"

  @Column({ type: 'decimal', precision: 8, scale: 3, nullable: true })
  weight: number; // "in KG"

  @Column(() => Dimensions)
  dimensions: Dimensions; // "in cm"

  @CreateDateColumn({ type: 'timestamp', default: () => CURRENT_TIMESTAMP })
  createAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => CURRENT_TIMESTAMP,
    onUpdate: CURRENT_TIMESTAMP,
  })
  updatedAt: Date;

  // ============ Relations ============

  @ManyToOne(() => Category, (category) => category.products, {
    onDelete: 'SET NULL',
    nullable: false,
  })
  category: Category;

  @ManyToOne(() => SubCategory, (subCategory) => subCategory.products, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  subCategory: SubCategory;

  @ManyToOne(() => Brand, (brand) => brand.products, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  brand: Brand;

  @OneToMany(() => Review, (review) => review.product)
  reviews: Review[];

  // ============= Methods =============
  updateStock(quantitySold: number): void {
    this.quantity -= quantitySold;
    this.sold += quantitySold;
    if (this.quantity <= 0) {
      this.status = ProductStatus.OUT_OF_STOCK;
    }
  }
}
