import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSettingsDto {
  @ApiPropertyOptional({ default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ default: 'light' })
  @IsOptional()
  @IsString()
  @IsIn(['light', 'dark'])
  theme?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  notificationsEnabled?: boolean;

  @ApiPropertyOptional({ default: 'Starter' })
  @IsOptional()
  @IsString()
  @IsIn(['Starter', 'Pro', 'Family'])
  subscriptionPlan?: string;
}

