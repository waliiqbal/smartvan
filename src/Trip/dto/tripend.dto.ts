/* eslint-disable prettier/prettier */
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class EndTripDto {
 @IsOptional()
  @IsString()
  tripId: string;

  @IsOptional()
  @IsNumber()
  lat: number;

  @IsOptional()
  @IsNumber()
  long: number;

  @IsOptional()
  @IsString()
  time?: string;   // 👈 string rakha hai
}
