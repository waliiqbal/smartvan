/* eslint-disable prettier/prettier */
import { IsOptional, IsString, IsMongoId, IsEnum } from 'class-validator';

export class AddAlertDto {
  @IsOptional()
  @IsString()
  alertType?: string;

  @IsEnum(['ALL_PARENTS', 'ALL_DRIVERS', 'SPECIFIC_VAN'])
  recipientType: 'ALL_PARENTS' | 'ALL_DRIVERS' | 'SPECIFIC_VAN';

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsMongoId()
  vanId?: string;

}