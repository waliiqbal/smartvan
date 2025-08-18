/* eslint-disable prettier/prettier */
import { IsMongoId, IsNumber, IsOptional } from 'class-validator';

export class PickStudentDto {
  @IsMongoId()
  kidId: string;

  @IsNumber()
  lat: number;

  @IsNumber()
  long: number;

  @IsOptional()
  time?: Date; // optional, service me default new Date() set hoga
}
