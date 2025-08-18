/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SchoolDocument = School & Document;

@Schema({ timestamps: true })
export class School {
  @Prop()
  schoolName: string;

  @Prop()
  schoolEmail: string;

  @Prop()
  address: string;

  @Prop()
  branchName: string;

  @Prop()
  lat: number;

  @Prop()
  long: number;

  @Prop()
  contactNumber: string;


  @Prop({ default: 'active' })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'Admin' })
  admin: Types.ObjectId;
}

export const SchoolSchema = SchemaFactory.createForClass(School);
