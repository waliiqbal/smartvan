/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  parentId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  driverId?: Types.ObjectId;

  @Prop({ required: false })
  title?: string;

  @Prop({ required: false })
  message?: string;


  @Prop({ required: false })
  actionType?: string;
}


export const NotificationSchema = SchemaFactory.createForClass(Notification);
