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
import { IncomesService } from './incomes.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { QueryIncomeDto } from './dto/query-income.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('incomes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('incomes')
export class IncomesController {
  constructor(private readonly service: IncomesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new income record' })
  async create(@CurrentUser() user: User, @Body() dto: CreateIncomeDto) {
    return this.service.create(user.id, dto);
  }

  @Get('monthly-aggregation')
  @ApiOperation({ summary: 'Get monthly income aggregates' })
  async getMonthlyAggregation(@CurrentUser() user: User) {
    return this.service.getMonthlyAggregation(user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user incomes with filters and pagination' })
  async findMany(@CurrentUser() user: User, @Query() query: QueryIncomeDto) {
    return this.service.findMany(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific income record by ID' })
  async findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.findById(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an income record' })
  async update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateIncomeDto,
  ) {
    return this.service.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an income record' })
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.remove(user.id, id);
  }
}
