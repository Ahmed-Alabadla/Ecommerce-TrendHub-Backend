import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { Roles } from 'src/users/decorators/user-role.decorator';
import { UserType } from 'src/utils/enums';
import { AuthRolesGuard } from 'src/users/guards/auth-roles.guard';

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  /**
   * @method POST
   * @route ~/api/suppliers
   * @access Private [Admin]
   */
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN)
  @Post()
  create(@Body() createSupplierDto: CreateSupplierDto) {
    return this.suppliersService.create(createSupplierDto);
  }

  /**
   * @method GET
   * @route ~/api/suppliers
   * @access Public
   */
  @Get()
  findAll() {
    return this.suppliersService.findAll();
  }

  /**
   * @method GET
   * @route ~/api/suppliers/:id
   * @access Public
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.suppliersService.findOne(id);
  }

  /**
   * @method PATCH
   * @route ~/api/suppliers/:id
   * @access Private [Admin]
   */
  @Patch(':id')
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSupplierDto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(id, updateSupplierDto);
  }

  /**
   * @method DELETE
   * @route ~/api/suppliers/:id
   * @access Private [Admin]
   */
  @Delete(':id')
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.suppliersService.remove(id);
  }
}
