/* eslint-disable prettier/prettier */
// src/kid/schemas/kid.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type KidDocument = Kid & Document;

@Schema({ timestamps: true })
export class Kid {
 @Prop({ type: Types.ObjectId, ref: 'User', required: true })
parentId: Types.ObjectId;


 @Prop({ type: Types.ObjectId, ref: 'School', required: false })
schoolId: Types.ObjectId;

 @Prop({ type: Types.ObjectId, ref: 'Van', required: false })
 vanId: Types.ObjectId;

@Prop({ required: false })
kidImage: string;

@Prop({ required: false })
fullname: string;

@Prop({ required: false })
gender: string;

@Prop({ required: false })
age: number;

@Prop({ required: false })
dob: Date;
}

export const KidSchema = SchemaFactory.createForClass(Kid);
