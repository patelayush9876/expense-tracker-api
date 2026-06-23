import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  UseGuards,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { UserMapper, UserResponseDto } from './mappers/user.mapper';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@CurrentUser() user: User): UserResponseDto {
    return UserMapper.toResponse(user);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update user profile' })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    const updatedUser = await this.userService.update(
      user.id,
      updateProfileDto,
    );
    return UserMapper.toResponse(updatedUser);
  }

  @Delete('account')
  @ApiOperation({ summary: 'Delete user account' })
  async deleteAccount(
    @CurrentUser() user: User,
  ): Promise<{ success: boolean }> {
    await this.userService.remove(user.id);
    return { success: true };
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get user settings' })
  async getSettings(@CurrentUser() user: User) {
    return this.userService.getSettings(user.id);
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update user settings' })
  async updateSettings(
    @CurrentUser() user: User,
    @Body() updateSettingsDto: UpdateSettingsDto,
  ) {
    return this.userService.updateSettings(user.id, updateSettingsDto);
  }

  @Post('seed')
  @ApiOperation({ summary: 'Seed mock historical data for the user' })
  async seedMockData(@CurrentUser() user: User): Promise<{ success: boolean }> {
    await this.userService.seedMockData(user.id);
    return { success: true };
  }
}
