import { Module } from '@nestjs/common';
import { IncomeCategoriesController } from './income-categories.controller';
import { IncomeCategoriesService } from './income-categories.service';
import { IncomeCategoriesRepository } from './repositories/income-categories.repository';

@Module({
  controllers: [IncomeCategoriesController],
  providers: [IncomeCategoriesService, IncomeCategoriesRepository],
  exports: [IncomeCategoriesService, IncomeCategoriesRepository],
})
export class IncomeCategoriesModule {}
