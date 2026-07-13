import { Module } from '@nestjs/common';
import { CreditCardsController } from './credit-cards.controller';
import { CreditCardsService } from './credit-cards.service';
import { CreditCardsRepository } from './repositories/credit-cards.repository';

@Module({
  controllers: [CreditCardsController],
  providers: [CreditCardsService, CreditCardsRepository],
  exports: [CreditCardsService, CreditCardsRepository],
})
export class CreditCardsModule {}
