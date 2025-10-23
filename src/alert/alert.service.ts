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
  const { alertType, vanId, message, recipientType } = addAlertDto;

  // 1️⃣ Validate school from admin
  const adminObjectId = new Types.ObjectId(adminId);
  const school = await this.databaseService.repositories.SchoolModel.findOne({
    admin: adminObjectId,
  });

  if (!school) {
    throw new UnauthorizedException('Invalid school or admin not authorized');
  }

  // 2️⃣ Title handling


  const notificationData: any = {
    schoolId: school._id,
  
    message: message || '',
    alertType,
    recipientType,
    date: new Date(),
  };

  // 3️⃣ SPECIFIC_VAN → add driverId
  if (recipientType === 'SPECIFIC_VAN') {
    if (!vanId) {
      throw new BadRequestException('vanId is required for SPECIFIC_VAN alerts');
    }

      const vanObjectId = new Types.ObjectId(vanId);

    const van = await this.databaseService.repositories.VanModel.findById(vanId);
    if (!van) {
      throw new NotFoundException('Van not found');
    }

    if (!van.driverId) {
      throw new NotFoundException('Driver not assigned to this van');
    }

   
    notificationData.VanId = vanObjectId;
  }
   
  

  // 4️⃣ ALL_DRIVERS or ALL_PARENTS → no driverId or parentId
  else if (recipientType === 'ALL_DRIVERS' || recipientType === 'ALL_PARENTS') {
  
  }

 
  else {
    throw new BadRequestException('Invalid recipientType value');
  }

  
  const notification = new this.databaseService.repositories.notificationModel(notificationData);
  const savedNotification = await notification.save();

  // 7️⃣ Return response
  return {
    message: 'Alert created successfully',
    data: savedNotification,
  };
}

async getAlerts(adminId: string, page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  // 1️⃣ Admin se schoolId nikaalo
  const adminObjectId = new Types.ObjectId(adminId);

  const school = await this.databaseService.repositories.SchoolModel.findOne({
    admin: adminObjectId,
  });

  if (!school) {
    throw new UnauthorizedException('Invalid admin or school not found');
  }

  const schoolId = school._id;

  // 2️⃣ Notification aggregation (filtered by schoolId)
  const alerts = await this.databaseService.repositories.notificationModel.aggregate([
    {
      $match: { schoolId: schoolId },
    },
    {
      $lookup: {
        from: 'vans',
        let: { vanId: '$VanId' },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$vanId'] } } },
          { $project: { carNumber: 1, _id: 0 } },
        ],
        as: 'vanInfo',
      },
    },
    {
      $unwind: {
        path: '$vanInfo',
        preserveNullAndEmptyArrays: true, // agar vanId null ho tab bhi document show ho
      },
    },
    {
      $project: {
        _id: 1,
        message: 1,
        alertType: 1,
        recipientType: 1,
        date: 1,
        status: 1,
        schoolId: 1,
        VanId: 1,

        vanNumber: '$vanInfo.carNumber',
      },
    },
    { $skip: skip },
    { $limit: limit },
  ]);

  // 3️⃣ Total count (same filter)
  const totalCount = await this.databaseService.repositories.notificationModel.countDocuments({
    schoolId: schoolId,
  });

  // 4️⃣ Return structured response
  return {
    data : {
    page,
    limit,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    alerts,
    }
  };
}

async getAlertById(adminId: string, alertId: string) {
  // 1️⃣ Convert IDs to ObjectId
  const adminObjectId = new Types.ObjectId(adminId);
  const alertObjectId = new Types.ObjectId(alertId);

  // 2️⃣ Admin se schoolId nikaalo
  const school = await this.databaseService.repositories.SchoolModel.findOne({
    admin: adminObjectId,
  });

  if (!school) {
    throw new UnauthorizedException('Invalid admin or school not found');
  }

  const schoolId = school._id;

  // 3️⃣ Specific alert find karo (schoolId ke sath match)
  const alert = await this.databaseService.repositories.notificationModel.findOne({
    _id: alertObjectId,
    schoolId: schoolId,
  });

  if (!alert) {
    throw new NotFoundException('Alert not found or not authorized');
  }

  // 4️⃣ Optional vanNumber handle karo
  const responseData: any = {
    _id: alert._id,
    message: alert.message,
    alertType: alert.alertType,
    recipientType: alert.recipientType,
    status: alert.status,
    date: alert.date,
    schoolId: alert.schoolId,
  };

  if (alert.VanId) {
    const van = await this.databaseService.repositories.VanModel.findById(alert.VanId, {
      carNumber: 1,
      _id: 0,
    });

    if (van) {
      responseData.VanId = alert.VanId;
      responseData.vanNumber = van.carNumber; // fixed name consistency
    }
  }

  // 5️⃣ Final response
  return {
    message: 'Alert fetched successfully',
    data: responseData,
  };
}

async editAlert(adminId: string, alertId: string, updateData: any) {
  const adminObjectId = new Types.ObjectId(adminId);
  const alertObjectId = new Types.ObjectId(alertId);

  // 1️⃣ Admin se school find karo
  const school = await this.databaseService.repositories.SchoolModel.findOne({
    admin: adminObjectId,
  });

  if (!school) {
    throw new UnauthorizedException('Invalid admin or school not found');
  }

  // 2️⃣ Alert document fetch karo
  const existingAlert = await this.databaseService.repositories.notificationModel.findOne({
    _id: alertObjectId,
    schoolId: school._id,
  });

  if (!existingAlert) {
    throw new NotFoundException('Alert not found');
  }

  // 3️⃣ Update fields prepare karo
  const { alertType, vanId, message, recipientType } = updateData;

  // ye basic fields update karenge agar aaye ho
  if (alertType) existingAlert.alertType = alertType;
  if (message) existingAlert.message = message;
  if (recipientType) existingAlert.recipientType = recipientType;

  // 4️⃣ Agar type SPECIFIC_VAN ho gaya
  if (recipientType === 'SPECIFIC_VAN') {
    if (!vanId) {
      throw new BadRequestException('vanId is required for SPECIFIC_VAN alerts');
    }

    const vanObjectId = new Types.ObjectId(vanId);
    const van = await this.databaseService.repositories.VanModel.findById(vanId);

    if (!van) {
      throw new NotFoundException('Van not found');
    }

    if (!van.driverId) {
      throw new NotFoundException('Driver not assigned to this van');
    }

    // VanId add/update karo
    existingAlert.VanId = vanObjectId;
  }

  // 5️⃣ Agar type ALL_DRIVERS ya ALL_PARENTS ho gaya
  else if (recipientType === 'ALL_DRIVERS' || recipientType === 'ALL_PARENTS') {
    // agar pehle koi vanId tha to hata do
    existingAlert.VanId = undefined;
  }

  // 6️⃣ Invalid recipientType
  else if (recipientType && !['SPECIFIC_VAN', 'ALL_DRIVERS', 'ALL_PARENTS'].includes(recipientType)) {
    throw new BadRequestException('Invalid recipientType value');
  }

  // 7️⃣ Save changes
  const updatedAlert = await existingAlert.save();

  // 8️⃣ Response return
  return {
    message: 'Alert updated successfully',
    data: updatedAlert,
  };
}



async deleteAlert(adminId: string, alertId: string) {
  const adminObjectId = new Types.ObjectId(adminId);
  const alertObjectId = new Types.ObjectId(alertId);

  // 1️⃣ Pehle check karo school admin ka hi hai ya nahi
  const school = await this.databaseService.repositories.SchoolModel.findOne({
    admin: adminObjectId,
  });

  if (!school) {
    throw new UnauthorizedException('Invalid admin or school not found');
  }

  const schoolId = school._id;

  // 2️⃣ Alert delete karo
  const deletedAlert = await this.databaseService.repositories.notificationModel.findOneAndDelete({
    _id: alertObjectId,
    schoolId: schoolId,
  });

  if (!deletedAlert) {
    throw new NotFoundException('Alert not found');
  }

  return {
    message: 'Alert deleted successfully',
  };
}




}