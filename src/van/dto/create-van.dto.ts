/* eslint-disable prettier/prettier */
import {
  IsNotEmpty,
  IsString,
  IsMongoId,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class CreateVanDto {

  @IsOptional()
  @IsString()
  venImage?: string;

 @IsOptional()
 @IsMongoId()
  schoolId?: string;


  @IsOptional()
  @IsString()
  cnic?: string;

  @IsOptional()
  @IsString()
  vehicleType?: string;

  @IsOptional()
  @IsNumber()
  venCapacity?: number;

  @IsOptional()
  @IsString()
  assignRoute?: string;

  @IsOptional()
  @IsString()
  licenceImageFront?: string;

  @IsOptional()
  @IsString()
  licenceImageBack?: string;

  @IsOptional()
  @IsString()
  carNumber?: string;

  @IsOptional()
  @IsString()
  vehicleCardImage?: string;
}
