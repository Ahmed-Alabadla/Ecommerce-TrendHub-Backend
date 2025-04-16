import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JWTPayload, QueriesFindAllUsers } from 'src/utils/types';
import { AuthRolesGuard } from './guards/auth-roles.guard';
import { Roles } from './decorators/user-role.decorator';
import { UserType } from 'src/utils/enums';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * @method POST
   * @route ~/api/admin/users
   * @access Private [Admin]
   */
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN)
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  /**
   * @method GET
   * @route ~/api/admin/users
   * @access Private [Admin]
   */
  @Roles(UserType.ADMIN)
  @UseGuards(AuthRolesGuard)
  @Get()
  findAll(@Query() queries: QueriesFindAllUsers) {
    return this.usersService.findAll(queries);
  }

  /**
   * @method GET
   * @route ~/api/admin/users/:id
   * @access Private [Admin]
   */
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  /**
   * @method PATCH
   * @route ~/api/admin/users/:id
   * @access Private [Admin]
   */
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  /**
   * @method DELETE
   * @route ~/api/admin/users/:id
   * @access Private [Admin]
   */
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}

@Controller('users/profile')
export class NormalUsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * @method GET
   * @route ~/api/users/profile
   * @access Private [Admin, Customer]
   */
  @Roles(UserType.ADMIN, UserType.CUSTOMER)
  @UseGuards(AuthRolesGuard)
  @Get()
  findOne(@CurrentUser() payload: JWTPayload) {
    return this.usersService.findOne(payload.id);
  }

  /**
   * @method PATCH
   * @route ~/api/users/profile
   * @access Private [Admin, Customer]
   */
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN, UserType.CUSTOMER)
  @Patch()
  update(
    @CurrentUser() payload: JWTPayload,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(payload.id, updateUserDto, payload);
  }

  /**
   * @method DELETE
   * @route ~/api/users/profile
   * @access Private [Admin, Customer]
   */
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN, UserType.CUSTOMER)
  @Delete()
  remove(@CurrentUser() payload: JWTPayload) {
    return this.usersService.remove(payload.id);
  }
}
