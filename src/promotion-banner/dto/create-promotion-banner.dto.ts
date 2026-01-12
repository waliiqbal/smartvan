import {
    IsArray,
    ValidateNested,
  } from 'class-validator';
  import { Type } from 'class-transformer';
  import { PromotionBannerItemDto } from './promotion-banner-item.dto';
  
  export class CreatePromotionBannerDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PromotionBannerItemDto)
    banners: PromotionBannerItemDto[];
  }
  