/* eslint-disable prettier/prettier */
import { IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateVanByAdminDto {
  // Driver Details
  @IsOptional()
  @IsString()
  fullname?: string;
  
  @IsOptional()
  @IsString()
  image?: string; // Full Name of the driver

  @IsOptional()
  @IsString()
  NIC?: string;         // Driver's NIC

  @IsOptional()
  @IsString()
  phoneNo?: string; 
  
   @IsOptional()
  @IsString()
  email?: string; 

  // Vehicle Details
  @IsOptional()
  @IsString()
  vehicleType?: string;        // Vehicle Type (e.g., Suzuki Bolan)

  @IsOptional()
  @IsString()
  carNumber?: string; // Plate number

  @IsOptional()
  @IsString()
  condition?: string;          // Condition (e.g., Good)

  @IsOptional()
  @IsNumber()
  venCapacity?: number;           // Vehicle capacity

  @IsOptional()
  @IsString()
  deviceId?: string;           // Device ID

  @IsOptional()
  @IsString()
  assignRoute?: string;              // Route number
}
