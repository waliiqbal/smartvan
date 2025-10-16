/* eslint-disable prettier/prettier */
import { IsOptional, IsString, IsNumber } from 'class-validator';

export class EditVanByAdminDto {
  @IsString()
  vanId: string;
  
  @IsOptional()
  @IsString()
  driverId?: string;

  @IsOptional()
  @IsString()
  vehicleType?: string;

  @IsOptional()
  @IsString()
  carNumber?: string;

  @IsOptional()
  @IsString()
  condition?: string;

  @IsOptional()
  @IsString()
  venImage?: string;

  @IsOptional()
  @IsNumber()
  venCapacity?: number;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsString()
  assignRoute?: string;
}
