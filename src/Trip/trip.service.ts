/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PickStudentDto } from './dto/pick-student.dto';
import mongoose from 'mongoose';
import * as moment from "moment-timezone"

import { Types } from "mongoose";

const TZ = "Asia/Karachi";



import { CreateTripDto } from './dto/create-trip.dto';
import { DatabaseService } from "src/database/databaseservice";
import { EndTripDto } from './dto/tripend.dto';
import { getLocationDto } from './dto/getLocations';
import { FirebaseAdminService } from 'src/notification/firebase-admin.service';
@Injectable()
export class TripService {
  constructor(
   private databaseService: DatabaseService,
   private firebaseAdminService: FirebaseAdminService
  ) {} 



async startTrip(driverId: string, createTripDto: CreateTripDto) {

  const driverObjectId = new Types.ObjectId(driverId);
  console.log(driverObjectId)
  
  const driver = await this.databaseService.repositories.driverModel.findById(driverObjectId);
  if (!driver) {
    throw new UnauthorizedException('Driver not found');
  }


  


 const van = await this.databaseService.repositories.VanModel.findOne({ driverId: driverObjectId });
  if (!van) {
    throw new BadRequestException('Van not assigned to this driver');
  }

  

  const schoolId = van.schoolId;
  
  if (!schoolId) {  
    throw new BadRequestException('Van is not associated with any school');
  }
  
   if (driver.schoolId !== van.schoolId) {
    throw new BadRequestException('Driver and Van school do not match');
  }

   if (van.status !== "active") {
    throw new BadRequestException('Van is not active');
  }
   

  if (!createTripDto.routeId) {
    throw new BadRequestException('Route ID is required to start a trip');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

  const getTrip = await this.databaseService.repositories.TripModel.findOne({ 
    routeId: createTripDto.routeId, 
    createdAt: {
    $gte: today,     
    $lt: tomorrow   
      } 
    });
    if(getTrip){
      throw new BadRequestException('this schedule trip already started');
    }
  

  const newTrip = new this.databaseService.repositories.TripModel({
    driverId: driverId,
    vanId: van._id.toString(),
    schoolId: van.schoolId,
    routeId: createTripDto.routeId,

    type: createTripDto.type || undefined,
   

    tripStart: {
      startTime: new Date(),
      lat: createTripDto.lat,
      long: createTripDto.long,
    },

    status: 'ongoing',

    kids: [],

  
    locations: (createTripDto.lat && createTripDto.long)
      ? [{
          lat: createTripDto.lat,
          long: createTripDto.long,
          time: new Date(), 
        }]
      : [],
  });

  // 🔍 Save karo
  const savedTrip = await newTrip.save();

  return {
    data: savedTrip.toObject(),
  };
}


async pickStudent(driverId, dto: PickStudentDto) {
  const driverObjectId = new Types.ObjectId(driverId);

  const driver = await this.databaseService.repositories.driverModel.findById(driverObjectId);
  if (!driver) {
    throw new UnauthorizedException('Driver not found');
  }

  const van = await this.databaseService.repositories.VanModel.findOne({ driverId: driverObjectId });
  if (!van) {
    throw new BadRequestException('Van not assigned to this driver');
  }

  const schoolId = van.schoolId;
  
  if (!schoolId) {  
    throw new BadRequestException('Van is not associated with any school');
  }
  
   if (driver.schoolId !== van.schoolId) {
    throw new BadRequestException('Driver and Van school do not match');
    
  }

  const tripObjectId = new Types.ObjectId(dto.tripId);

  console.log(tripObjectId)
  

   


  const trip = await this.databaseService.repositories.TripModel.findById(tripObjectId);
  if (!trip) {
    throw new NotFoundException('Trip not found');
  }

  if (trip.vanId !== van._id.toString()) {
    throw new BadRequestException("Van does not belong to this trip");
  }

  if (van.status !== "active") {
    throw new BadRequestException('Van is not active');
  }

const kid = await this.databaseService.repositories.KidModel.findById(dto.kidId);

 if (kid.status !== "active")
  {
    throw new BadRequestException('Kid is not active');
  } 

  

  trip.kids.push({
    kidId: dto.kidId,
    lat: dto.lat,
    long: dto.long,
    time: dto.time || new Date(),
    status: 'picked',
  });

  await trip.save();


  

  if (kid?.parentId) {
    const parent = await this.databaseService.repositories.parentModel.findById(kid.parentId);

    const title = "Kid Picked";
    const message = `${kid.fullname} has been picked by the van driver.`;

   
    if (parent?.fcmToken) {
      await this.firebaseAdminService.sendToDevice(
        parent.fcmToken,
        {
          notification: {
            title,
            body: message,
          },
          data: {
            kidId: kid._id.toString(),
            status: 'picked',
            time: new Date().toISOString(),
          }
        }
      );
    }

 
    await this.databaseService.repositories.notificationModel.create({
      type: "driver",
      parentId: kid.parentId,
      VanId: van._id,
      title: title,
      message: message,
      actionType: "PICKED",
      status: "sent",
      date: new Date(),
    });
  }

  return {
    message: "Kid picked, notification sent & saved",
    data: trip
  };
}

async endTrip(driverId, dto: EndTripDto) {
  const { tripId, lat, long, time } = dto;
  const driverObjectId = new Types.ObjectId(driverId);


  const driver = await this.databaseService.repositories.driverModel.findById(driverObjectId);
  if (!driver) throw new UnauthorizedException('Driver not found');


  const van = await this.databaseService.repositories.VanModel.findOne({ driverId: driverObjectId });
  if (!van) throw new BadRequestException('Van not assigned to this driver');

  const schoolId = van.schoolId;
  
  if (!schoolId) {  
    throw new BadRequestException('Van is not associated with any school');
  }
  
   if (driver.schoolId !== van.schoolId) {
    throw new BadRequestException('Driver and Van school do not match');
  }


  const trip = await this.databaseService.repositories.TripModel.findById(tripId);
  if (!trip) throw new NotFoundException('Trip not found');

  if (trip.vanId !== van._id.toString()) {
    throw new BadRequestException("Van does not belong to this trip");
  }

  trip.kids = trip.kids.map(kid => ({
    ...kid,
    status: 'dropped',
    time: time ? new Date(time) : new Date(),
    lat,
    long,
  }));

  trip.status = 'end';
  trip.tripEnd = {
    endTime: time ? new Date(time) : new Date(),
    lat,
    long,
  };

  await trip.save();


  for (const kidEntry of trip.kids) {

    const kidDoc = await this.databaseService.repositories.KidModel.findById(kidEntry.kidId);
    if (!kidDoc?.parentId) continue; // agar parentId nahi hai to skip

    const parent = await this.databaseService.repositories.parentModel.findById(kidDoc.parentId);
    if (!parent) continue;

    
const title = "Student Dropped";
const message = `${kidDoc.fullname} has been safely dropped.`;



    if (parent.fcmToken) {
      await this.firebaseAdminService.sendToDevice(
        parent.fcmToken,
        {
          notification: { title, body: message },
          data: {
            kidId: kidDoc._id.toString(),
            status: 'dropped',
            tripId: trip._id.toString(),
            time: new Date().toISOString(),
          },
        }
      );
    }


    await this.databaseService.repositories.notificationModel.create({
      type: "driver",
      parentId: kidDoc.parentId,
      VanId: van._id,
      title: title,
      message: message,
      actionType: "DROPPED",
      status: "sent",
      date: new Date(),
    });
  }

  return {
    message: "Trip ended, notifications sent & saved",
    data: trip,
  };
}


async getLocationByDriver( dto: getLocationDto) {
  const { tripId,  } = dto;






  const trip = await this.databaseService.repositories.TripModel.findById(tripId);
  if (!trip) {
    throw new NotFoundException('Trip not found');
  }
  


// ✅ Sirf required fields return karo
  return {
    data: {
      type: trip.type,
      status: trip.status,
      locations: trip.locations,
    },
  };
}

async getTripsByAdmin(
  AdminId: string,
  page = 1,
  limit = 10,
  status?: string,
  userType?: string
) {
  const adminObjectId = new Types.ObjectId(AdminId);
  const skip = (page - 1) * limit;

  let schoolFilter: any = {};


  if (userType === "admin") {
    const school = await this.databaseService.repositories.SchoolModel.findOne({ admin: adminObjectId });
    if (!school) throw new UnauthorizedException("School not found");
    schoolFilter = { schoolId: school._id.toString() };
  } else if (userType === "superadmin") {
   
    schoolFilter = {};
  } else {
    throw new UnauthorizedException("Invalid user type");
  }

 
  const pipeline: any[] = [
    {
      $match: {
        ...schoolFilter,
        ...(status ? { status } : {})
      }
    },
  
   
    {
      $addFields: {
        vanObjectId: {
          $cond: {
            if: { $and: [{ $ne: ["$vanId", null] }, { $ne: ["$vanId", ""] }] },
            then: { $toObjectId: "$vanId" },
            else: null
          }
        }
      }
    },
  
 
    {
      $addFields: {
        routeObjectId: {
          $cond: {
            if: { $and: [{ $ne: ["$routeId", null] }, { $ne: ["$routeId", ""] }] },
            then: { $toObjectId: "$routeId" },
            else: null
          }
        }
      }
    },
  

    {
      $lookup: {
        from: "vans",
        localField: "vanObjectId",
        foreignField: "_id",
        as: "van"
      }
    },
    { $unwind: { path: "$van", preserveNullAndEmptyArrays: true } },
  
    
    {
      $lookup: {
        from: "drivers",
        localField: "van.driverId",
        foreignField: "_id",
        as: "driver"
      }
    },
    { $unwind: { path: "$driver", preserveNullAndEmptyArrays: true } },
  
    // ⭐ ROUTE LOOKUP
    {
      $lookup: {
        from: "routes",
        localField: "routeObjectId",
        foreignField: "_id",
        as: "route"
      }
    },
    { $unwind: { path: "$route", preserveNullAndEmptyArrays: true } },
  
    // Add fields
    {
      $addFields: {
        driverId: { $ifNull: [{ $toString: "$driver._id" }, ""] },
        driverName: { $ifNull: ["$driver.fullname", ""] },
        driverImage: { $ifNull: ["$driver.image", ""] },
        carNumber: { $ifNull: ["$van.carNumber", ""] },
        carName: { $ifNull: ["$van.vehicleType", ""] },
  
        // ⭐ Added fields for route
        routeTitle: { $ifNull: ["$route.title", ""] },
        routeTripType: { $ifNull: ["$route.tripType", ""] }
      }
    },
  
    // ⭐ School Join (your existing code)
    {
      $addFields: {
        schoolObjectId: {
          $cond: {
            if: { $and: [{ $ne: ["$schoolId", null] }, { $ne: ["$schoolId", ""] }] },
            then: { $toObjectId: "$schoolId" },
            else: null
          }
        }
      }
    },
    {
      $lookup: {
        from: "schools",
        localField: "schoolObjectId",
        foreignField: "_id",
        as: "school"
      }
    },
    { $unwind: { path: "$school", preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        schoolName: { $ifNull: ["$school.name", ""] }
      }
    },
  
    // Project
    {
      $project: {
        van: 0,
        driver: 0,
        school: 0,
        route: 0,
        routeObjectId: 0
      }
    },
  
    { $skip: skip },
    { $limit: limit }
  ];
  
  

  const trips = await this.databaseService.repositories.TripModel.aggregate(pipeline);

  // Step 3: Pagination total
  const total = await this.databaseService.repositories.TripModel.countDocuments({
    ...schoolFilter,
    ...(status ? { status } : {})
  });

  return {
    message: "Trips fetched successfully",
    data: trips,
    user: userType,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}


async generateGraphData(
  AdminId: string,
  adminType: "admin" | "superadmin",
  filterType: "weekly" | "monthly" | "yearly"
) {
  const adminObjectId = new Types.ObjectId(AdminId);

  // 1) Resolve time window + labels
  let start: moment.Moment;
  let end: moment.Moment;
  let labels: string[] = [];

  if (filterType === "weekly") {
    start = moment().tz(TZ).startOf("isoWeek");
    end = moment().tz(TZ).endOf("isoWeek");
    labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  } else if (filterType === "monthly") {
    start = moment().tz(TZ).startOf("month");
    end = moment().tz(TZ).endOf("month");
    const dim = start.daysInMonth();
    labels = Array.from({ length: dim }, (_, i) => String(i + 1).padStart(2, "0"));
  } else if (filterType === "yearly") {
    start = moment().tz(TZ).startOf("year");
    end = moment().tz(TZ).endOf("year");
    labels = moment.monthsShort();
  } else {
    throw new Error("Invalid filterType");
  }

  // 2) Base match for graph
  const match: any = {
    createdAt: { $gte: start.toDate(), $lte: end.toDate() },
  };

  // SchoolId store karne ke liye
  let schoolIdString: string | null = null;

  // Agar admin hai → uska school nikaalna
  if (adminType === "admin") {
    const school = await this.databaseService.repositories.SchoolModel
      .findOne({ admin: adminObjectId })
      .lean();

    if (!school) throw new UnauthorizedException("School not found");

    schoolIdString = String(school._id ?? school.id);
    match.schoolId = schoolIdString;
  }

  // 3) Group key per filter
  let groupId: any;
  if (filterType === "weekly") {
    groupId = { $isoDayOfWeek: { date: "$createdAt", timezone: TZ } }; // 1..7
  } else if (filterType === "monthly") {
    groupId = { $dateToString: { format: "%d", date: "$createdAt", timezone: TZ } };
  } else {
    groupId = { $dateToString: { format: "%m", date: "$createdAt", timezone: TZ } };
  }

  const TripModel = this.databaseService.repositories.TripModel;

  const rows: Array<{ _id: any; count: number }> = await TripModel.aggregate([
    { $match: match },
    { $group: { _id: groupId, count: { $sum: 1 } } },
  ]);

  // 4) Zero-filled map
  const map: Record<string, number> = {};
  for (const l of labels) map[l] = 0;

  // 5) Fill counts into map
  for (const r of rows) {
    if (filterType === "weekly") {
      const idx = (Number(r._id) || 1) - 1;
      const label = labels[idx];
      if (label) map[label] = r.count;
    } else if (filterType === "monthly") {
      const label = String(r._id);
      if (label in map) map[label] = r.count;
    } else {
      const monthNum = Number(r._id);
      const label = moment().month(monthNum - 1).format("MMM");
      if (label in map) map[label] = r.count;
    }
  }

  // 6) Graph data array
  const graphData = labels.map((label) => ({
    name: label,
    count: map[label] || 0,
  }));

  // --------------- EXTRA COUNTS ---------------
  const VanModel = this.databaseService.repositories.VanModel;
  const KidModel = this.databaseService.repositories.KidModel; // adjust if plural
  // TripModel already available

  // Base filter for admin (for superadmin → no filter)
  const baseCountFilter: any = {};
  if (adminType === "admin" && schoolIdString) {
    baseCountFilter.schoolId = schoolIdString;
  }

  // Parallel counts
  const [vansCount, tripsCount, kidsCount] = await Promise.all([
    VanModel.countDocuments(adminType === "admin" ? baseCountFilter : {}),
    TripModel.countDocuments(adminType === "admin" ? baseCountFilter : {}),
    KidModel.countDocuments(adminType === "admin" ? baseCountFilter : {}),
  ]);

  const driversCount = vansCount; // drivers = vans count

  // --------------- Final response ---------------
  const data = {
    graph: graphData,
    counts: {
      vans: vansCount,
      drivers: driversCount,
      trips: tripsCount,
      kids: kidsCount,
    },
  };

  return { data };
}




}