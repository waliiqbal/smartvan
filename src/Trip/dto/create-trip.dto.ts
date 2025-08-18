/* eslint-disable prettier/prettier */
import { IsEnum, IsMongoId, IsNumber, IsOptional, ValidateNested, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

class TripStartDto {
  @IsOptional()
  @IsDate()
  startTime?: Date;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  long?: number;
}

class LocationDto {
  @IsNumber()
  lat?: number;

  @IsNumber()
  long?: number;

  @IsOptional()
  @IsDate()
  time?: Date;
}

export class CreateTripDto {
  @IsMongoId()
  vanId: string; // required

  @IsMongoId()
  schoolId: string; // required

  @IsOptional()
  @IsEnum(['pick', 'drop'])
  type?: 'pick' | 'drop';

  @IsOptional()
  @ValidateNested()
  @Type(() => TripStartDto)
  tripStart?: TripStartDto;

  @IsOptional()
  @IsEnum(['start', 'ongoing', 'end'])
  status?: 'start' | 'ongoing' | 'end';

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => LocationDto)
  locations?: LocationDto[];
}

