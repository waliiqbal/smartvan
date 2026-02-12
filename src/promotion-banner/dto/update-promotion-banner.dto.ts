import { PartialType } from '@nestjs/mapped-types';
import { PromotionBannerItemDto } from './promotion-banner-item.dto';

export class UpdatePromotionBannerDto extends PartialType(
  PromotionBannerItemDto,
) {}
