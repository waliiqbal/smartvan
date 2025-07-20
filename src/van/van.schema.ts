/* eslint-disable prettier/prettier */
// eslint-disable-next-line prettier/prettier
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VanDocument = Van & Document;

@Schema({ timestamps: true })
export class Van {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  driverId: Types.ObjectId;

  @Prop({ required: true })
  venImage: string;

  @Prop({ required: true })
  cnic: string;

  @Prop({ required: true })
  vehicleType: string;

  @Prop({ required: true })
  venCapacity: number;

  @Prop({ required: true })
  assignRoute: string;

  @Prop({ required: true })
  licenceImageFront: string;

  @Prop({ required: true })
  licenceImageBack: string;

  @Prop({ required: true })
  carNumber: string;

  @Prop({ required: true })
  vehicleCardImage: string;

  // jwtToken intentionally excluded (we won't store it)
}

export const VanSchema = SchemaFactory.createForClass(Van);
