/* eslint-disable prettier/prettier */
import { IsOptional, IsString, IsBoolean, IsObject } from 'class-validator';

export class CreateRouteDto {

  @IsOptional()
  @IsString()
  schoolId?: string;

   @IsOptional()
  @IsString()
  vanId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  startTime?: string; // example: "07:30 AM"

  @IsOptional()
  @IsString()
  tripType?: string; // morning / evening / afternoon / night

  @IsOptional()
  @IsObject()
  tripDays?: {
    monday?: boolean;
    tuesday?: boolean;
    wednesday?: boolean;
    thursday?: boolean;
    friday?: boolean;
    saturday?: boolean;
    sunday?: boolean;
  };

  @IsOptional()
  @IsObject()
  startPoint?: {
    lat?: number;
    long?: number;
  };

  @IsOptional()
  @IsObject()
  endPoint?: {
    lat?: number;
    long?: number;
  };
}
