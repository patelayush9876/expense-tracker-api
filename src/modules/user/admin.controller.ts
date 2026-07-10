import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { AdminGuard } from '@/modules/auth/guards/admin.guard';
import { UserService } from './user.service';
import { UserMapper } from './mappers/user.mapper';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly userService: UserService) {}

  @Get('users')
  @ApiOperation({ summary: 'List all users in the system' })
  async listUsers() {
    const users = await this.userService.findAllUsers();
    return users.map((u) => UserMapper.toResponse(u));
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Update a user role' })
  async updateRole(
    @Param('id') id: string,
    @Body('role') role: string,
  ) {
    const updated = await this.userService.updateRole(id, role);
    return UserMapper.toResponse(updated);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete user account' })
  async deleteUser(@Param('id') id: string) {
    await this.userService.remove(id);
    return { success: true };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get admin portal dashboard overview statistics' })
  async getStats() {
    return this.userService.getAdminStats();
  }
}
