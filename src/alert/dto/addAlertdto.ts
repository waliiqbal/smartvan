/* eslint-disable prettier/prettier */
import { IsOptional, IsString, IsMongoId } from 'class-validator';

export class AddAlertDto {
  @IsOptional()
  @IsString()
  alertType?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsMongoId()
  vanId?: string;

  @IsOptional()
  @IsMongoId()
  schoolId?: string;
}
