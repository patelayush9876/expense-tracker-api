import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IncomeCategoriesRepository } from './repositories/income-categories.repository';
import { CreateIncomeCategoryDto } from './dto/create-category.dto';
import { UpdateIncomeCategoryDto } from './dto/update-category.dto';
import { IncomeCategory } from '@prisma/client';

@Injectable()
export class IncomeCategoriesService {
  constructor(private readonly repository: IncomeCategoriesRepository) {}

  async create(
    userId: string,
    dto: CreateIncomeCategoryDto,
  ): Promise<IncomeCategory> {
    return this.repository.create({
      name: dto.name,
      userId,
    });
  }

  async findAll(userId: string): Promise<IncomeCategory[]> {
    return this.repository.findAll(userId);
  }

  async findById(userId: string, id: string): Promise<IncomeCategory> {
    const category = await this.repository.findById(id);
    if (!category || category.userId !== userId) {
      throw new NotFoundException(`Income category with ID ${id} not found`);
    }
    return category;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateIncomeCategoryDto,
  ): Promise<IncomeCategory> {
    await this.findById(userId, id);
    return this.repository.update(id, { name: dto.name });
  }

  async remove(userId: string, id: string): Promise<IncomeCategory> {
    const category = (await this.findById(userId, id)) as any;
    if (category._count && category._count.incomes > 0) {
      throw new BadRequestException(
        'Cannot delete category with associated incomes',
      );
    }
    return this.repository.delete(id);
  }
}
