import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import {
  AdminUsersController,
  NormalUsersController,
} from './users.controller';

import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), CloudinaryModule],
  controllers: [AdminUsersController, NormalUsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
