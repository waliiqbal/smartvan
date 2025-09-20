/* eslint-disable prettier/prettier */
import { IsEnum, IsNumber, IsOptional } from 'class-validator';

export class CreateTripDto {
  @IsOptional()
  @IsEnum(['pick', 'drop'])
  type?: 'pick' | 'drop';

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  long?: number;
}
