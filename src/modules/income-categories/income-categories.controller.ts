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
import { IncomeCategoriesService } from './income-categories.service';
import { CreateIncomeCategoryDto } from './dto/create-category.dto';
import { UpdateIncomeCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('income-categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('income-categories')
export class IncomeCategoriesController {
  constructor(private readonly service: IncomeCategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new income category' })
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateIncomeCategoryDto,
  ) {
    return this.service.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user income categories' })
  async findAll(@CurrentUser() user: User) {
    return this.service.findAll(user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an income category' })
  async update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateIncomeCategoryDto,
  ) {
    return this.service.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an income category' })
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.remove(user.id, id);
  }
}
