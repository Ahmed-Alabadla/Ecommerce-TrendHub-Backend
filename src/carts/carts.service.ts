import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCartDto } from './dto/create-cart.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Cart } from './entities/cart.entity';
import { Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { CartItem } from './entities/cart-item.entity';
import { CouponType, ProductStatus } from '../utils/enums';
import { Coupon } from '../coupons/entities/coupon.entity';

@Injectable()
export class CartsService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartsRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemsRepository: Repository<CartItem>,

    @InjectRepository(Coupon)
    private readonly couponsRepository: Repository<Coupon>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  /**
   * Create a new cart in the database
   * @param productId id of the product
   * @param userId id of the user
   * @param createCartDto data for creating a new cart (quantity, etc.)
   * @returns created cart
   */
  async createCart(
    productId: number,
    userId: number,
    createCartDto: CreateCartDto,
  ) {
    // find the product by id
    const product = await this.productsRepository.findOne({
      where: { id: productId },
    });
    // check if the product exists
    if (!product) {
      throw new NotFoundException(`Product with id ${productId} not found`);
    }

    // check if the product is not discontinued
    if ((product.status as ProductStatus) === ProductStatus.DISCONTINUED) {
      throw new BadRequestException(
        `Product with id ${productId} is discontinued`,
      );
    }

    // check if the product is not out of stock
    if ((product.status as ProductStatus) === ProductStatus.OUT_OF_STOCK) {
      throw new BadRequestException(
        `Product with id ${productId} is out of stock`,
      );
    }
    // check if the product is not out of stock
    if (product.quantity < 1) {
      throw new BadRequestException(
        `Product with id ${productId} is out of stock`,
      );
    }

    // check if createCartDto.quantity > product.quantity
    if (createCartDto.quantity && createCartDto.quantity > product.quantity) {
      throw new BadRequestException('Quantity is greater than available stock');
    }

    // check if the cart exists for the user
    const cart = await this.cartsRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user', 'coupon'],
    });

    // if the cart does not exist, create a new one
    if (!cart) {
      const newCart = this.cartsRepository.create({
        user: { id: userId },
      });

      // save the new cart to the database
      await this.cartsRepository.save(newCart);

      // create a new cart item
      const cartItem = this.cartItemsRepository.create({
        product: product,
        cart: newCart,
        ...createCartDto,
      });

      await this.cartItemsRepository.save(cartItem);

      // add the cart item to the cart
      newCart.cartItems = [cartItem];

      // update the total price of the cart and if product has a discount, apply it
      if (Number(cartItem.product.priceAfterDiscount) > 0)
        newCart.totalPrice =
          Number(cartItem.product.priceAfterDiscount) *
          Number(cartItem.quantity);
      else
        newCart.totalPrice =
          Number(cartItem.product.price) * Number(cartItem.quantity);

      // save the cart with the new cart item
      await this.cartsRepository.save(newCart);
      return newCart;
    } else {
      // if the cart exists, check if the product is already in the cart
      const cartItem = await this.cartItemsRepository.findOne({
        where: {
          product: { id: product.id },
          cart: { id: cart.id },
        },
        relations: ['product', 'cart'],
      });

      // if the product is already in the cart, update the quantity
      if (cartItem) {
        const oldQuantity: number = Number(cartItem.quantity);

        if (createCartDto.quantity) {
          if (createCartDto.quantity > product.quantity) {
            throw new BadRequestException(
              'Quantity is greater than available stock',
            );
          }
          cartItem.quantity = createCartDto.quantity;
        } else {
          cartItem.quantity = Number(cartItem.quantity) + 1;
        }

        // Save the cartItem to the database
        await this.cartItemsRepository.save(cartItem);

        const updateCart = await this.cartsRepository.findOne({
          where: { id: cart.id },
          relations: ['cartItems', 'coupon'],
        });
        if (!updateCart) {
          throw new NotFoundException(`Cart with ${cart.id} not fount`);
        }
        // Then update the cart's total price

        let itemTotalPrice: number;
        let itemTotalPriceOld: number;

        if (Number(cartItem.product.priceAfterDiscount) > 0) {
          itemTotalPrice =
            Number(cartItem.product.priceAfterDiscount) * cartItem.quantity;
          itemTotalPriceOld =
            oldQuantity * Number(cartItem.product.priceAfterDiscount);
        } else {
          itemTotalPrice = Number(cartItem.product.price) * cartItem.quantity;
          itemTotalPriceOld = oldQuantity * Number(cartItem.product.price);
        }

        // totalPrice = total price + new total price for item after update quantity - old total price for item before update quantity
        updateCart.totalPrice =
          Number(updateCart.totalPrice) - itemTotalPriceOld + itemTotalPrice;

        // Update totalPriceAfterDiscount if coupon is applied
        if (updateCart.coupon) {
          if ((updateCart.coupon.type as CouponType) === CouponType.FIXED) {
            updateCart.totalPriceAfterDiscount =
              Number(updateCart.totalPrice) - updateCart.coupon.discount;
          }
          if (
            (updateCart.coupon.type as CouponType) === CouponType.PERCENTAGE
          ) {
            updateCart.totalPriceAfterDiscount =
              Number(updateCart.totalPrice) -
              (updateCart.totalPrice * updateCart.coupon.discount) / 100;
          }
        }

        return await this.cartsRepository.save(updateCart);
      } else {
        // create a new cart item
        const newCartItem = this.cartItemsRepository.create({
          product: product,
          cart: cart,
          ...createCartDto,
        });

        await this.cartItemsRepository.save(newCartItem);

        // add the cart item to the cart
        cart.cartItems.push(newCartItem);

        // update the total price of the cart and if product has a discount, apply it

        let itemTotalPrice: number;
        if (Number(newCartItem.product.priceAfterDiscount) > 0) {
          itemTotalPrice =
            Number(newCartItem.product.priceAfterDiscount) *
            newCartItem.quantity;
        } else {
          itemTotalPrice =
            Number(newCartItem.product.price) * newCartItem.quantity;
        }

        cart.totalPrice = Number(cart.totalPrice) + itemTotalPrice;
        //
        // Update totalPriceAfterDiscount if coupon is applied
        if (cart.coupon) {
          if ((cart.coupon.type as CouponType) === CouponType.FIXED) {
            cart.totalPriceAfterDiscount =
              Number(cart.totalPrice) - cart.coupon.discount;
          }
          if ((cart.coupon.type as CouponType) === CouponType.PERCENTAGE) {
            cart.totalPriceAfterDiscount =
              Number(cart.totalPrice) -
              (cart.totalPrice * cart.coupon.discount) / 100;
          }
        }

        // save the cart with the new cart item
        return await this.cartsRepository.save(cart);
      }
    }
  }

  /**
   * Remove a specific item from the cart
   * @param productId id of the product to remove
   * @param userId id of the user
   * @returns updated cart or confirmation message
   */
  async removeItemFromCart(productId: number, userId: number) {
    // find the cart by userId
    const cart = await this.findOneByUser(userId);

    // find the cart item to remove
    const cartItem = await this.cartItemsRepository.findOne({
      where: {
        product: { id: productId },
        cart: { id: cart.id },
      },
      relations: ['product'],
    });

    // check if the cart item exists
    if (!cartItem) {
      throw new NotFoundException(
        `Product with id ${productId} not found in cart`,
      );
    }

    // calculate the item's total price to subtract from cart total
    let itemTotalPrice: number;
    if (Number(cartItem.product.priceAfterDiscount) > 0) {
      itemTotalPrice =
        Number(cartItem.product.priceAfterDiscount) * cartItem.quantity;
    } else {
      itemTotalPrice = Number(cartItem.product.price) * cartItem.quantity;
    }

    // remove the cart item from database
    await this.cartItemsRepository.remove(cartItem);

    // update the cart's total price
    cart.totalPrice = Number(cart.totalPrice) - itemTotalPrice;

    // if coupon is applied, recalculate totalPriceAfterDiscount
    if (cart.coupon) {
      if ((cart.coupon.type as CouponType) === CouponType.FIXED) {
        cart.totalPriceAfterDiscount =
          Number(cart.totalPrice) - cart.coupon.discount;
      }
      if ((cart.coupon.type as CouponType) === CouponType.PERCENTAGE) {
        cart.totalPriceAfterDiscount =
          Number(cart.totalPrice) -
          (cart.totalPrice * cart.coupon.discount) / 100;
      }
    }

    // save the updated cart
    await this.cartsRepository.save(cart);

    return { message: 'Item removed from cart successfully!' };
  }

  /**
   * Find all carts from the database
   * @returns all carts
   */
  async findAllCarts() {
    const carts = await this.cartsRepository.find({
      relations: ['cartItems', 'cartItems.product', 'user', 'coupon'],
      order: { updatedAt: 'DESC' },
    });
    return carts;
  }

  /**
   * Find a cart by userId from the database
   * @param userId user Id
   * @returns cart
   */
  async findOneByUser(userId: number) {
    const cart = await this.cartsRepository.findOne({
      where: { user: { id: userId } },
      relations: [
        'cartItems',
        'cartItems.product',
        'coupon',
        'cartItems.product.brand',
      ],
    });
    if (!cart) {
      throw new NotFoundException("Don't have any cart yet!");
    }
    // if (cart.user.id !== userId) {
    //   throw new UnauthorizedException('You not allow to delete this cart!');
    // }
    return cart;
  }

  /**
   * Remove a cart by userId from the database
   * @param userId id of the user
   * @returns confirmation message
   */
  async removeCart(userId: number) {
    const cart = await this.findOneByUser(userId);

    await this.cartItemsRepository.delete({ cart });

    await this.cartsRepository.remove(cart);
    return { message: 'Cart deleted successfully!' };
  }

  /**
   * Apply a coupon to the cart
   * @param code coupon code
   * @param userId id of the user
   * @returns confirmation message
   */
  async applyCouponToCart(code: string, userId: number) {
    // find the cart by userId
    const cart = await this.findOneByUser(userId);
    // check if the coupon is already applied to the cart
    if (cart.coupon) {
      throw new BadRequestException('Coupon already applied to the cart');
    }

    // find the coupon by code
    const coupon = await this.couponsRepository.findOne({
      where: { code },
    });
    if (!coupon) {
      throw new BadRequestException('Invalid coupon code');
    }

    // check if the coupon is expired
    const currentDate = new Date();
    if (currentDate > coupon.expirationDate) {
      throw new BadRequestException('Invalid coupon code');
    }

    // check if the coupon is already used
    if (coupon.currentUsage >= coupon.maxUsage) {
      throw new BadRequestException('Invalid coupon code');
    }

    // update the current usage of the coupon
    coupon.currentUsage += 1;
    await this.couponsRepository.save(coupon);

    // apply the coupon to the cart
    cart.coupon = coupon;
    if ((coupon.type as CouponType) === CouponType.FIXED) {
      cart.totalPriceAfterDiscount = Number(cart.totalPrice) - coupon.discount;
    }
    if ((coupon.type as CouponType) === CouponType.PERCENTAGE) {
      cart.totalPriceAfterDiscount =
        Number(cart.totalPrice) - (cart.totalPrice * coupon.discount) / 100;
    }
    await this.cartsRepository.save(cart);

    return { message: 'Coupon applied successfully!' };
  }

  /**
   * Remove a coupon from the cart
   * @param userId id of the user
   * @returns confirmation message
   */
  async removeCouponFromCart(userId: number) {
    // find the cart by userId
    const cart = await this.findOneByUser(userId);
    // check if the coupon is already applied to the cart
    if (!cart.coupon) {
      throw new BadRequestException('Coupon not applied to the cart');
    }

    // remove the coupon from the cart
    cart.coupon = null;
    cart.totalPriceAfterDiscount = 0;
    await this.cartsRepository.save(cart);

    return { message: 'Coupon removed successfully!' };
  }
}
