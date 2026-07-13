import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  Max,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCreditCardDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  limit: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  @Max(31)
  dueDate: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  @Max(31)
  billingDate: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(4, 4)
  last4?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  network?: string;
}
