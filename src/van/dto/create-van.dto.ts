/* eslint-disable prettier/prettier */
import {
  IsNotEmpty,
  IsString,
  IsMongoId,
  IsNumber
} from 'class-validator';

export class CreateVanDto {
  @IsNotEmpty()
  @IsMongoId()
  driverId: string;

  @IsNotEmpty()
  @IsString()
  venImage: string;

  @IsNotEmpty()
  @IsString()
  cnic: string;

  @IsNotEmpty()
  @IsString()
  vehicleType: string;

  @IsNotEmpty()
  @IsNumber()
  venCapacity: number;

  @IsNotEmpty()
  @IsString()
  assignRoute: string;

  @IsNotEmpty()
  @IsString()
  licenceImageFront: string;

  @IsNotEmpty()
  @IsString()
  licenceImageBack: string;

  @IsNotEmpty()
  @IsString()
  carNumber: string;

  @IsNotEmpty()
  @IsString()
  vehicleCardImage: string;
}
