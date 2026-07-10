import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { AdminController } from './admin.controller';
import { UserService } from './user.service';
import { UserRepository } from './repositories/user.repository';

@Module({
  controllers: [UserController, AdminController],
  providers: [UserService, UserRepository],
  exports: [UserService, UserRepository],
})
export class UserModule {}
