/* eslint-disable prettier/prettier */
// create-kid.dto.ts

import { IsNotEmpty, IsString, IsNumber, IsDate, IsOptional, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateKidDto {

  @IsOptional()
  @IsString()
  image?: string; // optional field

  @IsOptional()
   @IsString()
  schoolId?: string;


  @IsOptional()
 @IsMongoId()
  parentId?: string;

    @IsOptional()
   @IsString()
     VanId?: string;


  @IsString()
  @IsOptional()
  fullname?: string;

    @IsString()
  @IsOptional()
  status?: string;

    @IsString()
  @IsOptional()
  grade?: string;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsNumber()
  @IsOptional()
  age?: number;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  dob?: Date;
}
