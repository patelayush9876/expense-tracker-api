import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InvestmentsService } from './investments.service';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { UpdateInvestmentDto } from './dto/update-investment.dto';
import { QueryInvestmentDto } from './dto/query-investment.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('investments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('investments')
export class InvestmentsController {
  constructor(private readonly service: InvestmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Add a new investment' })
  async create(@CurrentUser() user: User, @Body() dto: CreateInvestmentDto) {
    return this.service.create(user.id, dto);
  }

  @Get('summary')
  @ApiOperation({
    summary: 'Get summary of all user investments (totals, P/L)',
  })
  async getSummary(@CurrentUser() user: User) {
    return this.service.getSummary(user.id);
  }

  @Get('portfolio-allocation')
  @ApiOperation({ summary: 'Get percentage allocation of investments by type' })
  async getPortfolioAllocation(@CurrentUser() user: User) {
    return this.service.getPortfolioAllocation(user.id);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all user investments with filter and pagination',
  })
  async findMany(
    @CurrentUser() user: User,
    @Query() query: QueryInvestmentDto,
  ) {
    return this.service.findMany(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific investment record' })
  async findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.findById(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an investment record' })
  async update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateInvestmentDto,
  ) {
    return this.service.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an investment record' })
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.remove(user.id, id);
  }
}
