/* eslint-disable prettier/prettier */
import { BadGatewayException, Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from "src/database/databaseservice";

import { Types } from 'mongoose';
import mongoose from 'mongoose';

import { AddAlertDto } from './dto/addAlertdto';





@Injectable()
export class alertService { 
  constructor(
   
    private databaseService: DatabaseService,



    
   
  ) {}


  async addAlert(addAlertDto: AddAlertDto, adminId: string) {
  const { alertType, vanId, title, message, schoolId } = addAlertDto;

  // 1️⃣ Validate school from admin
  const adminObjectId = new Types.ObjectId(adminId);
  const school = await this.databaseService.repositories.SchoolModel.findOne({ _id: schoolId, admin: adminObjectId });

  if (!school) {
    throw new UnauthorizedException('Invalid school or admin not authorized');
  }

  // 2️⃣ Find van and get driverId
  const van = await this.databaseService.repositories.VanModel.findById(vanId);
  if (!van) {
    throw new NotFoundException('Van not found');
  }

  const driverId = van.driverId;
  if (!driverId) {
    throw new NotFoundException('Driver not assigned to this van');
  }

  // 3️⃣ Title handling: agar title nahi aya to alertType ko title bana do
  const finalTitle = title || alertType;

  // 4️⃣ Create notification entry
  const notification = new this.databaseService.repositories.notificationModel({
    schoolId: school._id,
    driverId: driverId,
    title: finalTitle,
    message: message || '',
    alertType,
    actionType: 'alert', // you can fix this type for now
    date: new Date(),
  });

  const savedNotification = await notification.save();

  // 5️⃣ Return response
  return {
    message: 'Alert created successfully',
    data: savedNotification,
  };
}

}