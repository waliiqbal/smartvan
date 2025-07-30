/* eslint-disable prettier/prettier */
// create-kid.dto.ts

import { IsNotEmpty, IsString, IsNumber, IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateKidDto {

  @IsOptional()
  kidImage?: string; // optional field

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
