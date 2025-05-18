import { IsEnum, IsString } from 'class-validator';
import { OrderStatusCash } from 'src/utils/enums';

export class UpdateOrderDto {
  @IsString()
  @IsEnum(OrderStatusCash)
  status: OrderStatusCash;
}
