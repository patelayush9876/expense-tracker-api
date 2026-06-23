import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ExpenseCategoriesRepository } from './repositories/expense-categories.repository';
import { CreateExpenseCategoryDto } from './dto/create-category.dto';
import { UpdateExpenseCategoryDto } from './dto/update-category.dto';
import { ExpenseCategory } from '@prisma/client';

@Injectable()
export class ExpenseCategoriesService {
  constructor(private readonly repository: ExpenseCategoriesRepository) {}

  async create(
    userId: string,
    dto: CreateExpenseCategoryDto,
  ): Promise<ExpenseCategory> {
    return this.repository.create({
      name: dto.name,
      userId,
    });
  }

  async findAll(userId: string): Promise<ExpenseCategory[]> {
    return this.repository.findAll(userId);
  }

  async findById(userId: string, id: string): Promise<ExpenseCategory> {
    const category = await this.repository.findById(id);
    if (!category || category.userId !== userId) {
      throw new NotFoundException(`Expense category with ID ${id} not found`);
    }
    return category;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateExpenseCategoryDto,
  ): Promise<ExpenseCategory> {
    await this.findById(userId, id);
    return this.repository.update(id, { name: dto.name });
  }

  async remove(userId: string, id: string): Promise<ExpenseCategory> {
    const category = (await this.findById(userId, id)) as any;
    if (category._count && category._count.expenses > 0) {
      throw new BadRequestException(
        'Cannot delete category with associated expenses',
      );
    }
    return this.repository.delete(id);
  }
}
