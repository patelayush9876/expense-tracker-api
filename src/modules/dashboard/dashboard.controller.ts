import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Get overall financial summary (balance, savings rate, net worth)',
  })
  async getSummary(@CurrentUser() user: User) {
    return this.service.getSummary(user.id);
  }

  @Get('monthly-income-expense')
  @ApiOperation({
    summary: 'Get monthly income vs expense totals for last 6 months',
  })
  async getMonthlyIncomeExpense(@CurrentUser() user: User) {
    return this.service.getMonthlyIncomeExpense(user.id);
  }

  @Get('category-breakdown')
  @ApiOperation({ summary: 'Get current month expense category breakdown' })
  async getCategoryBreakdown(@CurrentUser() user: User) {
    return this.service.getCategoryBreakdown(user.id);
  }

  @Get('cash-flow')
  @ApiOperation({ summary: 'Get cash flow tracking for last 12 months' })
  async getCashFlow(@CurrentUser() user: User) {
    return this.service.getCashFlow(user.id);
  }

  @Get('investment-allocation')
  @ApiOperation({ summary: 'Get asset allocation for portfolio' })
  async getInvestmentAllocation(@CurrentUser() user: User) {
    return this.service.getInvestmentAllocation(user.id);
  }

  @Get('net-worth-history')
  @ApiOperation({ summary: 'Get historical net worth snapshots' })
  async getNetWorthHistory(@CurrentUser() user: User) {
    return this.service.getNetWorthHistory(user.id);
  }
}
