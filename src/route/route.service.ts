/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DatabaseService } from 'src/database/databaseservice';
import { Types } from 'mongoose';
import { CreateRouteDto } from './dto/createRoutedto';


@Injectable()
export class RouteService {
  constructor(
  private databaseService: DatabaseService,
  ) {}

  async createRoute(dto: CreateRouteDto, adminId: string) {
    console.log(adminId)
    
   const adminObjectId = new Types.ObjectId(adminId);
   console.log(adminObjectId)

  // Step 1: find school
  const school = await this.databaseService.repositories.SchoolModel.findOne({ admin: adminObjectId });
  if (!school) {
    throw new UnauthorizedException("School not found");
  }

   
    const schoolIdString = school._id.toString();


    const newRoute = await this.databaseService.repositories.routeModel.create({
      ...dto,
      schoolId: schoolIdString,
    });

    return newRoute;
  }

  async getAssignedTripByDriver(driverId: string) {
  if (!driverId) {
    throw new UnauthorizedException('Invalid driver token');
  }

  // Step 1: Driver find karo (sirf name lo)
  const driver = await this.databaseService.repositories.driverModel.findById(
    new Types.ObjectId(driverId),
    { fullname: 1 }
  );

  if (!driver) {
    throw new BadRequestException('Driver not found');
  }

  // Step 2: Van find karo driverId se
  const van = await this.databaseService.repositories.VanModel.findOne({
    driverId: new Types.ObjectId(driverId),
  },
   { assignRoute: 1 , carNumber: 1  }
);

  if (!van) {
    throw new BadRequestException('Van not found for this driver');
  }

  // Step 3: Route find karo based on vanId (string comparison)
  const route = await this.databaseService.repositories.routeModel.findOne({
    vanId: van._id.toString(),
  });

  if (!route) {
    throw new BadRequestException('No route assigned to this van');
  }

  // ✅ Step 3.1: Check if today is active trip day (Pakistan timezone)
const today = new Date().toLocaleString('en-US', { 
  weekday: 'long', 
  timeZone: 'Asia/Karachi'   // Pakistan timezone set kiya
}).toLowerCase();  
// e.g. 'monday', 'tuesday', etc.

if (!route.tripDays?.[today]) {
  // agar aaj ka din tripDays me false ya undefined hai
  return {
    message: 'No active trip today',
    data: null,
  };
}


  // Step 4: School find karo (schoolId route me string hai)
  const school = await this.databaseService.repositories.SchoolModel.findById(
    new Types.ObjectId(route.schoolId),
    {  contactNumber: 1 }
  );

  if (!school) {
    throw new BadRequestException('school not found');
  }
  // Step 5: Kids count nikaalo (van._id se)
  const totalKids = await this.databaseService.repositories.KidModel.countDocuments({
    VanId: van._id,
  });

  // Step 6: Response ready karo
  return {
    message: 'Assigned trip fetched successfully',
    data: {
      driverName: driver.fullname,
      vehicleType: van.vehicleType,
      vehicleNumber: van.carNumber,
      routeTitle: route.title,
      tripType: route.tripType,
      startTime: route.startTime,
      
      schoolContact: school?.contactNumber || null,
      totalKids,
    },
  };
}

}

