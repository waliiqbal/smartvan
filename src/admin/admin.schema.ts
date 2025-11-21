/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AdminDocument = Admin & Document;

@Schema({ timestamps: true })
export class Admin {
  @Prop()
  name: string;

  @Prop()
  email: string;

  @Prop()
  password: string;

   @Prop()
  otp: string;
  
  
  @Prop()
  image: string;
  
   @Prop()
   otpExpiresAt: Date;


  @Prop()
  age: number;

  @Prop({ enum: ['admin', 'superadmin'], default: 'admin' })
  role: string;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
