/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

class FaqItem {
  @Prop({ required: true })
  question: string;

  @Prop({ required: true })
  answer: string;
}

export type FAQDocument = FAQ & Document;

@Schema({ timestamps: true })
export class FAQ {
  @Prop({ type: [FaqItem], default: [] })
  faqs: FaqItem[];
}

export const FAQSchema = SchemaFactory.createForClass(FAQ);