import { Module } from '@nestjs/common';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { ExpensesRepository } from './repositories/expenses.repository';
import { ExpenseCategoriesModule } from '../expense-categories/expense-categories.module';

@Module({
  imports: [ExpenseCategoriesModule],
  controllers: [ExpensesController],
  providers: [ExpensesService, ExpensesRepository],
  exports: [ExpensesService, ExpensesRepository],
})
export class ExpensesModule {}
