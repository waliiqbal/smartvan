/* eslint-disable prettier/prettier */
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateInvoiceDto {
  @IsNotEmpty()
  @IsString()
  schoolId: string;

  @IsOptional()
  @IsString()
  billingCycle?: string; // e.g. "Monthly"

  @IsOptional()
  @IsString()
  planType?: string; // e.g. "Per Student"

  @IsOptional()
  @IsString()
  startDate?: string; // e.g. "01-Aug-2025"

  @IsOptional()
  @IsString()
  paymentMethod?: string; // e.g. "Stripe"

  @IsOptional()
  @IsString()
  amount?: string; // e.g. "450.00 USD"

  @IsOptional()
  @IsString()
  invoiceStatus?: string; // e.g. "Paid"

  @IsOptional()
  @IsString()
  notes?: string;
}
