import { PartialType } from '@nestjs/swagger';
import { CreatePromotionBannerDto } from './create-promotion-banner.dto';

export class UpdatePromotionBannerDto extends PartialType(CreatePromotionBannerDto) {}
