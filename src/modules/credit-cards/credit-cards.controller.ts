import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CreditCardsService } from './credit-cards.service';
import { CreateCreditCardDto } from './dto/create-credit-card.dto';
import { UpdateCreditCardDto } from './dto/update-credit-card.dto';
import { PayBillDto } from './dto/pay-bill.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('credit-cards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('credit-cards')
export class CreditCardsController {
  constructor(private readonly service: CreditCardsService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new credit card' })
  async create(@CurrentUser() user: User, @Body() dto: CreateCreditCardDto) {
    return this.service.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user credit cards with balances' })
  async findAll(@CurrentUser() user: User) {
    return this.service.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific credit card by ID' })
  async findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.findById(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a credit card record' })
  async update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateCreditCardDto,
  ) {
    return this.service.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a credit card record' })
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.remove(user.id, id);
  }

  @Post(':id/pay-bill')
  @ApiOperation({ summary: 'Log a credit card bill payment' })
  async payBill(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: PayBillDto,
  ) {
    return this.service.payBill(user.id, id, dto);
  }
}
