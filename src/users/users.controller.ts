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
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JWTPayload } from '../utils/types';
import { AuthRolesGuard } from './guards/auth-roles.guard';
import { Roles } from './decorators/user-role.decorator';
import { UserType } from '../utils/enums';
import { CurrentUser } from './decorators/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';

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
  @UseInterceptors(FileInterceptor('avatar'))
  @Post()
  create(
    @Body() createUserDto: CreateUserDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 2 }), // 2MB
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|gif|webp)$/ }), // More specific
        ],
        fileIsRequired: false,
      }),
    )
    file?: Express.Multer.File,
  ) {
    return this.usersService.create(createUserDto, file);
  }

  /**
   * @method GET
   * @route ~/api/admin/users
   * @access Private [Admin]
   */
  @Roles(UserType.ADMIN)
  @UseGuards(AuthRolesGuard)
  @Get()
  findAll(
    @Query('name') name?: string,
    @Query('email') email?: string,
    @Query('role') role?: UserType,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.usersService.findAll(name, email, role, page, limit);
  }

  /**
   * @method GET
   * @route ~/api/admin/users/role/:role
   * @access Private [Admin]
   */
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN)
  @Get('role/:role')
  findByRole(@Param('role') role: string) {
    if (!Object.values(UserType).includes(role.toLowerCase() as UserType)) {
      throw new BadRequestException(
        'Invalid role provided for filtering users by role (admin/customer)',
      );
    }
    return this.usersService.findAllByRole(role);
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
  @UseInterceptors(FileInterceptor('avatar'))
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 2 }), // 2MB
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|gif|webp)$/ }), // More specific
        ],
        fileIsRequired: false,
      }),
    )
    file?: Express.Multer.File,
  ) {
    return this.usersService.update(id, updateUserDto, file);
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
  @UseInterceptors(FileInterceptor('avatar'))
  @Patch()
  update(
    @CurrentUser() payload: JWTPayload,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 2 }), // 2MB
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|gif|webp)$/ }), // More specific
        ],
        fileIsRequired: false,
      }),
    )
    file?: Express.Multer.File,
  ) {
    return this.usersService.update(payload.id, updateUserDto, file);
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
