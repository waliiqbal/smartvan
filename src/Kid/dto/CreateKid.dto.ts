/* eslint-disable prettier/prettier */
// create-kid.dto.ts

import { IsNotEmpty, IsString, IsNumber, IsDate,  } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateKidDto {

  @IsString()
  kidImage?: string; // optional field

  @IsString()
  @IsNotEmpty()
  fullname: string;

  @IsString()
  @IsNotEmpty()
  gender: string;

  @IsNumber()
  @IsNotEmpty()
  age: number;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  dob: Date;
}
