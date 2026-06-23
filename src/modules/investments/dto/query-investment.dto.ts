import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SearchDto } from '@/common/dto/search.dto';
import { InvestmentType } from '@prisma/client';

export class QueryInvestmentDto extends SearchDto {
  @ApiPropertyOptional({ enum: InvestmentType })
  @IsOptional()
  @IsEnum(InvestmentType)
  type?: InvestmentType;
}
