import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PromotionBannerDocument = PromotionBanner & Document;

@Schema({ timestamps: true })
export class PromotionBanner {

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true })
  imageUrl: string;

  // Web / App redirection
  @Prop()
  redirectUrl?: string;

  // Mobile app deep link (optional)
  @Prop()
  deepLink?: string;

  // Show / Hide banner
  @Prop({ default: true })
  isActive: boolean;

  // Banner order (top priority first)
  @Prop({ default: 0 })
  priority: number;

  // Banner visible duration
  @Prop()
  startDate?: Date;

  @Prop()
  endDate?: Date;

  // Admin / System
  @Prop({ default: false })
  isDeleted: boolean;
}

export const PromotionBannerSchema =
  SchemaFactory.createForClass(PromotionBanner);
