import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { PasswordResetToken } from '../src/auth/entities/password-reset-token.entity';
import { Brand } from '../src/brands/entities/brand.entity';
import { Cart } from '../src/carts/entities/cart.entity';
import { CartItem } from '../src/carts/entities/cart-item.entity';
import { Category } from '../src/categories/entities/category.entity';
import { Coupon } from '../src/coupons/entities/coupon.entity';
import { Order } from '../src/orders/entities/order.entity';
import { OrderItem } from '../src/orders/entities/order-item.entity';
import { Product } from '../src/products/entities/product.entity';
import { Dimensions } from '../src/products/entities/dimensions.entity';
import { Review } from '../src/reviews/entities/review.entity';
import { Setting } from '../src/settings/entities/setting.entity';
import { SubCategory } from '../src/sub-categories/entities/sub-category.entity';
import { Supplier } from '../src/suppliers/entities/supplier.entity';
import { User } from '../src/users/entities/user.entity';

// Load environment variables from .env file
config({ path: '.env' });

// database connection options
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [
    PasswordResetToken,
    Brand,
    Cart,
    CartItem,
    Category,
    Coupon,
    Order,
    OrderItem,
    Product,
    Dimensions,
    Review,
    Setting,
    SubCategory,
    Supplier,
    User,
  ],
  migrations: ['dist/db/migrations/*.js'],
  synchronize: false, // Set to false in production
  logging: true, // Enable logging for debugging
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
