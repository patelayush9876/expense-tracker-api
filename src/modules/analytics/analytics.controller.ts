import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get('spending-trends')
  @ApiOperation({
    summary: 'Get comparison of current spending with previous month',
  })
  async getSpendingTrends(@CurrentUser() user: User) {
    return this.service.getSpendingTrends(user.id);
  }

  @Get('income-trends')
  @ApiOperation({
    summary: 'Get comparison of current income with previous month',
  })
  async getIncomeTrends(@CurrentUser() user: User) {
    return this.service.getIncomeTrends(user.id);
  }

  @Get('top-categories')
  @ApiOperation({ summary: 'Get top spending categories in the current month' })
  async getTopCategories(@CurrentUser() user: User) {
    return this.service.getTopCategories(user.id);
  }

  @Get('savings-analysis')
  @ApiOperation({ summary: 'Get savings rate analytics over time' })
  async getSavingsAnalysis(@CurrentUser() user: User) {
    return this.service.getSavingsAnalysis(user.id);
  }

  @Get('investment-performance')
  @ApiOperation({
    summary: 'Get performance analysis of investments portfolio',
  })
  async getInvestmentPerformance(@CurrentUser() user: User) {
    return this.service.getInvestmentPerformance(user.id);
  }
}
