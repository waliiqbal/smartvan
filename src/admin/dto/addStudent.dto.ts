/* eslint-disable prettier/prettier */
import { IsNotEmpty, IsString, IsNumber, IsDate, IsOptional, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

export class AddStudentDto {

  @IsOptional()
  kidImage?: string; // optional field
 
  
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
  gender?: string;

   @IsString()
  @IsOptional()
  grade?: string;

   @IsString()
  @IsOptional()
  status?: string;



  @IsNumber()
  @IsOptional()
  age?: number;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  dob?: Date;
}


