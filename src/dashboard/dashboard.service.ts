import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brand } from '../brands/entities/brand.entity';
import { Cart } from '../carts/entities/cart.entity';
import { Category } from '../categories/entities/category.entity';
import { Coupon } from '../coupons/entities/coupon.entity';
import { Order } from '../orders/entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { SubCategory } from '../sub-categories/entities/sub-category.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { User } from '../users/entities/user.entity';
import { OrderStatus } from '../utils/enums';
import { Repository } from 'typeorm';

export interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalCategories: number;
  totalSubCategories: number;
  totalOrders: number;
  totalRevenue: number;
  totalBrands: number;
  totalCarts: number;
  totalCoupons: number;
  totalSuppliers: number;
}

export interface MonthlySales {
  month: string;
  year: number;
  sales: number;
  orders: number;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Brand)
    private brandsRepository: Repository<Brand>,

    @InjectRepository(Cart)
    private cartsRepository: Repository<Cart>,

    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,

    @InjectRepository(SubCategory)
    private subCategoriesRepository: Repository<SubCategory>,

    @InjectRepository(Coupon)
    private couponsRepository: Repository<Coupon>,

    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,

    @InjectRepository(Product)
    private productsRepository: Repository<Product>,

    @InjectRepository(User)
    private usersRepository: Repository<User>,

    @InjectRepository(Supplier)
    private suppliersRepository: Repository<Supplier>,
  ) {}

  /**
   * Get dashboard data including total counts and revenue
   * @returns DashboardStats
   */
  async getDashboardData(): Promise<DashboardStats> {
    const totalBrands = await this.brandsRepository.count();
    const totalCarts = await this.cartsRepository.count();
    const totalCategories = await this.categoriesRepository.count();
    const totalSubCategories = await this.subCategoriesRepository.count();
    const totalCoupons = await this.couponsRepository.count();
    const totalOrders = await this.ordersRepository.count();
    const totalProducts = await this.productsRepository.count();
    const totalUsers = await this.usersRepository.count();
    const totalSuppliers = await this.suppliersRepository.count();

    const totalRevenue = await this.getTotalRevenue();

    return {
      totalBrands,
      totalCarts,
      totalCategories,
      totalSubCategories,
      totalCoupons,
      totalOrders,
      totalProducts,
      totalUsers,
      totalSuppliers,
      totalRevenue,
    };
  }

  /**
   * Get monthly sales data
   * This method retrieves sales data grouped by month for the current year.
   * @returns Array of MonthlySales objects
   */
  async getMonthlySales() {
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1); // January 1st of current year
    const endDate = new Date(currentYear + 1, 0, 1); // January 1st of next year

    // Define the type for raw query results
    interface MonthlySalesRaw {
      month: string;
      year: string;
      sales: string;
      orders: string;
    }

    const rawData: MonthlySalesRaw[] = await this.ordersRepository
      .createQueryBuilder('order')
      .select([
        'EXTRACT(MONTH FROM order.createdAt) as month',
        'EXTRACT(YEAR FROM order.createdAt) as year',
        'SUM(order.totalOrderPrice) as sales',
        'COUNT(order.id) as orders',
      ])
      .where('order.createdAt >= :startDate', { startDate })
      .andWhere('order.createdAt < :endDate', { endDate })
      .andWhere('order.status = :status', { status: OrderStatus.PAID })
      .groupBy(
        'EXTRACT(YEAR FROM order.createdAt), EXTRACT(MONTH FROM order.createdAt)',
      )
      .orderBy('year, month')
      .getRawMany();

    // Create array for all 12 months with default values
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    const monthlySalesData: MonthlySales[] = monthNames.map((monthName) => ({
      month: monthName,
      year: currentYear,
      sales: 0,
      orders: 0,
    }));

    // Fill in actual data
    rawData.forEach((row: MonthlySalesRaw) => {
      const monthIndex = parseInt(row.month) - 1; // Convert to 0-based index
      if (monthIndex >= 0 && monthIndex < 12) {
        monthlySalesData[monthIndex] = {
          month: monthNames[monthIndex],
          year: parseInt(row.year),
          sales: parseFloat(row.sales || '0'),
          orders: parseInt(row.orders || '0'),
        };
      }
    });

    return monthlySalesData;
  }

  /**
   * Get recent orders
   * This method retrieves the most recent orders from the database.
   * @param limit Number of recent orders to retrieve
   * @returns Array of recent orders
   */
  async getRecentOrders(limit: number = 5) {
    return await this.ordersRepository.find({
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['orderItems', 'orderItems.product', 'user'],
    });
  }

  /**
   * Get total revenue from paid orders
   * This method calculates the total revenue from all orders that have been paid.
   * @returns Total revenue from paid orders
   */
  private async getTotalRevenue() {
    const result = await this.ordersRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalOrderPrice)', 'total')
      .where('order.status = :status', { status: OrderStatus.PAID })
      .getRawOne<{ total: string | null }>();

    return parseFloat(result?.total || '0');
  }
}
