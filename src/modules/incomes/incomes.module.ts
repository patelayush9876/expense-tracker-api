import { Module } from '@nestjs/common';
import { IncomesController } from './incomes.controller';
import { IncomesService } from './incomes.service';
import { IncomesRepository } from './repositories/incomes.repository';
import { IncomeCategoriesModule } from '../income-categories/income-categories.module';

@Module({
  imports: [IncomeCategoriesModule],
  controllers: [IncomesController],
  providers: [IncomesService, IncomesRepository],
  exports: [IncomesService, IncomesRepository],
})
export class IncomesModule {}
