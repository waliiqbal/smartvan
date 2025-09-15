/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReportDocument = Report & Document;

@Schema({ timestamps: true })
export class Report {
  @Prop({ required: false })
  kidId?: string;

  @Prop({ required: false })
  driverId?: string;

  @Prop({ required: false })
  issueType?: string;

  @Prop({ required: false })
  description?: string;

  @Prop({ required: false })
  image?: string;

  @Prop({ required: false })
  dateOfIncident?: Date;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
