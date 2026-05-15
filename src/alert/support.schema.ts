/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SupportDocument = Support & Document;

@Schema({ timestamps: true })
export class Support {

  @Prop({
    enum: [
      'phone',
      'email',
      'whatsapp',
      'instagram',
      'facebook',
      'linkedin',
      'youtube',
    ],
    required: true,
  })
  type: string;

  @Prop({ type: String })
  title: string;

  @Prop({ type: String })
  value: string;

  @Prop({ type: String, default: null })
  url: string | null;


  @Prop({ enum: ['active', 'inactive'], default: 'active' })
  status: string;

  @Prop({ default: false })
  isDelete: boolean;
}

export const SupportSchema = SchemaFactory.createForClass(Support);

SupportSchema.index({ type: 1 });
SupportSchema.index({ status: 1 });