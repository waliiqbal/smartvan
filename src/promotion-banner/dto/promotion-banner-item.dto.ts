import {
    IsString,
    IsOptional,
    IsBoolean,
    IsNumber,
    IsDateString,
    IsUrl,
  } from 'class-validator';
  
  export class PromotionBannerItemDto {
    @IsString()
    title: string;
  
    @IsString()
    imageUrl: string;
  
    @IsOptional()
    @IsString()
    redirectUrl?: string;
  
    @IsOptional()
    @IsString()
    deepLink?: string;
  
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
  
    @IsOptional()
    @IsNumber()
    priority?: number;
  
    @IsOptional()
    @IsDateString()
    startDate?: string;
  
    @IsOptional()
    @IsDateString()
    endDate?: string;
  }
  