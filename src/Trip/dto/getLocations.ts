import { IsOptional, IsString, IsNumber } from 'class-validator';

export class getLocationDto {
  @IsOptional()
  @IsString()
  tripId?: string;

 
}
