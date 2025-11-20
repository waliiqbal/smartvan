/* eslint-disable prettier/prettier */
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTripDto {

  
  @IsOptional()
  @IsString()
  routeId?: string;


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
