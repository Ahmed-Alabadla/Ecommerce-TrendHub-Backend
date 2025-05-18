export enum UserType {
  ADMIN = 'admin',
  CUSTOMER = 'customer',
}

export enum GenderType {
  MALE = 'male',
  FEMALE = 'female',
}

export enum CouponType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export enum ProductStatus {
  ACTIVE = 'Active',
  OUT_OF_STOCK = 'OutOfStock',
  DISCONTINUED = 'Discontinued',
}
export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
}
export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum OrderStatusCash {
  PAID = 'paid',
  CANCELLED = 'cancelled',
}
