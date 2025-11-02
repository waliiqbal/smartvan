/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InvoiceDocument = Invoice & Document;

@Schema({ timestamps: true })
export class Invoice {

@Prop({ type: String, required: true })
schoolId: string;

  @Prop({ required: false })
  billingCycle: string; // e.g. "Monthly"

  @Prop({ required: false })
  planType: string; // e.g. "Per Student"

  @Prop({ required: false })
  startDate: string; // e.g. "01-Aug-2025" (keeping as string like your example)

  @Prop({ required: false })
  paymentMethod: string; // e.g. "Stripe"

  @Prop({ required: false })
  amount: string; // e.g. "450.00 USD"

  @Prop({ required: false })
  invoiceStatus: string; // e.g. "Paid"

  @Prop({ required: false })
  notes: string;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
