import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/databaseservice';
import { CreatePromotionBannerDto } from './dto/create-promotion-banner.dto';
import { UpdatePromotionBannerDto } from './dto/update-promotion-banner.dto';
import { Types } from 'mongoose';

@Injectable()
export class PromotionBannerService {
  constructor(private readonly databaseService: DatabaseService) {}

  // CREATE
  async create(dto: CreatePromotionBannerDto) {
    const banners = await this.databaseService.repositories.PromotionBannerModel.insertMany(
      dto.banners,
    );

    return {
      message: 'Promotion banner created successfully',
      data: banners,
    };
  }

  // GET ALL (Admin / Dashboard)
  async findAll() {
    const banners =
      await this.databaseService.repositories.PromotionBannerModel.find({
        isDeleted: false,
      })
        .sort({ priority: -1, createdAt: -1 });

    return {
      message: 'Promotion banners fetched successfully',
      data: banners,
    };
  }

  // GET ACTIVE (App side)
  async findActive() {
    const now = new Date();
  
    const banners =
      await this.databaseService.repositories.PromotionBannerModel.find({
        isDeleted: false,
        isActive: true,
        $and: [
          {
            $or: [
              { startDate: null },
              { startDate: { $lte: now } },
            ],
          },
          {
            $or: [
              { endDate: null },
              { endDate: { $gte: now } },
            ],
          },
        ],
      }).sort({ priority: -1 });
  
    return {
      message: 'Active promotion banners',
      data: banners,
    };
  }
  

  // GET BY ID
  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid banner id');
    }

    const banner =
      await this.databaseService.repositories.PromotionBannerModel.findOne({
        _id: id,
        isDeleted: false,
      });

    if (!banner) {
      throw new NotFoundException('Promotion banner not found');
    }

    return {
      message: 'Promotion banner fetched',
      data: banner,
    };
  }

  // UPDATE
  async update(id: string, dto: UpdatePromotionBannerDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid banner id');
    }

    const banner =
      await this.databaseService.repositories.PromotionBannerModel.findByIdAndUpdate(
        id,
        dto,
        { new: true },
      );

    if (!banner) {
      throw new NotFoundException('Promotion banner not found');
    }

    return {
      message: 'Promotion banner updated successfully',
      data: banner,
    };
  }

  // SOFT DELETE
  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid banner id');
    }

    const banner =
      await this.databaseService.repositories.PromotionBannerModel.findByIdAndUpdate(
        id,
        { isDeleted: true },
        { new: true },
      );

    if (!banner) {
      throw new NotFoundException('Promotion banner not found');
    }

    return {
      message: 'Promotion banner deleted successfully',
    };
  }
}
