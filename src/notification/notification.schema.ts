/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;



@Schema({ timestamps: true })
export class Notification {

  @Prop()
  type?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  parentId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Van', required: false })
  VanId?: Types.ObjectId;

   @Prop({ type: Types.ObjectId, ref: 'School', required: false })
  schoolId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Route', required: false })
  RouteId?: Types.ObjectId;

  @Prop({ required: false })
  title?: string;

    @Prop({ required: false })
  alertType?: string;

  @Prop({ required: false })
  message?: string;

  @Prop({ required: false })
  actionType?: string;

  
    @Prop({ required: false, default: "sent" })
  status?: string;


  @Prop({
    type: String,
    enum: ['ALL_PARENTS', 'ALL_DRIVERS', 'SPECIFIC_VAN'],
    required: false,
  })
  recipientType: 'ALL_PARENTS' | 'ALL_DRIVERS' | 'SPECIFIC_VAN';


  @Prop({ type: Date, default: Date.now })
  date?: Date;

}



export const NotificationSchema = SchemaFactory.createForClass(Notification);
