/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {

  @Prop()
  schoolId: string;
 @Prop()
  fullname: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ unique: true })
  phoneNo: string;

  @Prop()
  alternatePhoneNo: string;

  @Prop()
  address: string;

  @Prop()
  lat: number;

  @Prop()
  long: number;

  @Prop()
  password: string;

  @Prop()
  otp: string;
  
   @Prop()
   otpExpiresAt: Date;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ enum: ['parent', 'driver'] })
  userType: string;

  @Prop({ default: null })
  avatar: string;
}




export const UserSchema = SchemaFactory.createForClass(User);
