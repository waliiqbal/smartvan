/* eslint-disable prettier/prettier */
// create-kid.dto.ts

import { IsNotEmpty, IsString, IsNumber, IsDate, IsOptional, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateKidDto {

  @IsOptional()
  kidImage?: string; // optional field

  @IsOptional()
 @IsMongoId()
  schoolId?: string;


  @IsOptional()
 @IsMongoId()
  parentId?: string;

    @IsOptional()
    @IsMongoId()
     VanId?: string;


  @IsString()
  @IsOptional()
  fullname: string;

  @IsString()
  @IsOptional()
  gender: string;

  @IsNumber()
  @IsOptional()
  age: number;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  dob: Date;
}
