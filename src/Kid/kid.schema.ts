/* eslint-disable prettier/prettier */
// src/kid/schemas/kid.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type KidDocument = Kid & Document;

@Schema({ timestamps: true })
export class Kid {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  parentId: Types.ObjectId;

  @Prop()
  kidImage: string;

  @Prop({ required: true })
  fullname: string;

  @Prop({ required: true})
  gender: string;

  @Prop({ required: true })
  age: number;

  @Prop({ required: true })
  dob: Date;
}

export const KidSchema = SchemaFactory.createForClass(Kid);
