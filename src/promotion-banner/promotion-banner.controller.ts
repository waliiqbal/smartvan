import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PromotionBannerService } from './promotion-banner.service';
import { CreatePromotionBannerDto } from './dto/create-promotion-banner.dto';
import { UpdatePromotionBannerDto } from './dto/update-promotion-banner.dto';

@Controller('promotion-banner')
export class PromotionBannerController {
  constructor(
    private readonly promotionBannerService: PromotionBannerService,
  ) {}

  // ADMIN
  @Post('create')
  create(@Body() dto: CreatePromotionBannerDto) {
    return this.promotionBannerService.create(dto);
  }

  // ADMIN
  @Get("findAll")
  findAll() {
    return this.promotionBannerService.findAll();
  }

  // APP
  @Get('active')
  findActive() {
    return this.promotionBannerService.findActive();
  }

  @Get('findOne/:id')
  findOne(@Param('id') id: string) {
    return this.promotionBannerService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePromotionBannerDto,
  ) {
    return this.promotionBannerService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.promotionBannerService.remove(id);
  }
}
