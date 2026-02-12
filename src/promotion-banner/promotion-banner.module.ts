import { Module } from '@nestjs/common';
import { PromotionBannerService } from './promotion-banner.service';
import { PromotionBannerController } from './promotion-banner.controller';

@Module({
  controllers: [PromotionBannerController],
  providers: [PromotionBannerService],
})
export class PromotionBannerModule {}
