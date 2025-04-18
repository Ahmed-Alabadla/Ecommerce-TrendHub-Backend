import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import {
  AdminUsersController,
  NormalUsersController,
} from './users.controller';

import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [AdminUsersController, NormalUsersController],
  providers: [UsersService],
})
export class UsersModule {}
