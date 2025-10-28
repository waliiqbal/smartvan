/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SchoolDocument = School & Document;

@Schema({ _id: false })
class InvoiceEntry {
  @Prop({ required: true })
  invoiceId: string;

  @Prop({ required: true })
  date: Date; // store real Date in DB, format for UI on frontend

  @Prop({ required: true })
  amount: number;

  @Prop({
    required: true,
    enum: ['paid', 'unpaid', 'overdue'], // you can adjust
    default: 'paid',
  })
  status: string;

  @Prop()
  downloadUrl?: string; // S3 link / PDF link etc.
}


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
  startTime: Date;
  
  @Prop()
  endTime: Date;

  @Prop()
  maxTripDuration: number;


  @Prop()
  bufferTime: number;

  @Prop({ enum: ['monthly', 'yearly'], default: 'monthly' })
  billingCycle: String;
  
  @Prop({ enum: ['bank'], default: 'bank' })
  paymentMethod: String;

  @Prop({ enum: ['perstudent', 'pervan', 'flatPlan'], default: 'flatPlan' })
  selectedPaymentPlan: String;


  @Prop({ type: [InvoiceEntry], default: [] })
  invoiceHistory: InvoiceEntry[];
  
  
  @Prop()
  allowedVens: number;

  @Prop()
  allowedStudents: number;

  @Prop()
  lat: number;

  @Prop()
  long: number;

  @Prop()
  autoRenew: boolean;

  @Prop()
  contactNumber: string;


  @Prop({ default: 'active' })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'Admin' })
  admin: Types.ObjectId;
}

export const SchoolSchema = SchemaFactory.createForClass(School);
