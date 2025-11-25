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
@Injectable()
export class TripService {
  constructor(
   private databaseService: DatabaseService,
  ) {} 



async startTrip(driverId: string, createTripDto: CreateTripDto) {

  const driverObjectId = new Types.ObjectId(driverId);
  console.log(driverObjectId)
  // 🔍 Step 1: Driver fetch karo
  const driver = await this.databaseService.repositories.driverModel.findById(driverObjectId);
  if (!driver) {
    throw new UnauthorizedException('Driver not found');
  }

  // 🔍 Step 2: Van fetch karo
 const van = await this.databaseService.repositories.VanModel.findOne({ driverId: driverObjectId });
  if (!van) {
    throw new BadRequestException('Van not assigned to this driver');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

  const getTrip = await this.databaseService.repositories.TripModel.findOne({ 
    routeId: createTripDto.routeId, 
    createdAt: {
    $gte: today,     // today 00:00:00
    $lt: tomorrow    // next day 00:00:00
      } 
    });
    if(getTrip){
      throw new BadRequestException('this schedule trip already started');
    }
  
  // 🔍 Step 3: Trip create karo
  const newTrip = new this.databaseService.repositories.TripModel({
    driverId: driverId,
    vanId: van._id.toString(),
    schoolId: van.schoolId,
    routeId: createTripDto.routeId,

    type: createTripDto.type || undefined,
   

    tripStart: {
      startTime: new Date(), // fixed, DTO se nahi lena
      lat: createTripDto.lat,
      long: createTripDto.long,
    },

    status: 'ongoing',

    kids: [],

    // lat/long agar aaye hain to ek hi location add karo
    locations: (createTripDto.lat && createTripDto.long)
      ? [{
          lat: createTripDto.lat,
          long: createTripDto.long,
          time: new Date(), // ab hamesha server se
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
  console.log(driverObjectId)
  // 🔍 Step 1: Driver fetch karo
  const driver = await this.databaseService.repositories.driverModel.findById(driverObjectId);
  if (!driver) {
    throw new UnauthorizedException('Driver not found');
  }

  // 🔍 Step 2: Van fetch karo
 const van = await this.databaseService.repositories.VanModel.findOne({ driverId: driverObjectId });
  if (!van) {
    throw new BadRequestException('Van not assigned to this driver');
  }
  const trip = await this.databaseService.repositories.TripModel.findById(dto.tripId);
  
  if (!trip) {
    throw new NotFoundException('Trip not found');
  }

 if (trip.vanId !== van._id.toString()) {
 
  throw new BadRequestException("Van does not belong to this trip"); // exception throw
}
  // Push new kid pickup data
  trip.kids.push({
    kidId: dto.kidId,
    lat:  dto.lat,
    long: dto.long,
    time: dto.time || new Date(),
    status: 'picked',
  });




  await trip.save();
   return {
    data: trip
  };
}

async endTrip(driverId,dto: EndTripDto) {
  const { tripId, lat, long, time } = dto;

  const driverObjectId = new Types.ObjectId(driverId);
  console.log(driverObjectId)
  // 🔍 Step 1: Driver fetch karo
  const driver = await this.databaseService.repositories.driverModel.findById(driverObjectId);
  if (!driver) {
    throw new UnauthorizedException('Driver not found');
  }

  // 🔍 Step 2: Van fetch karo
 const van = await this.databaseService.repositories.VanModel.findOne({ driverId: driverObjectId });
  if (!van) {
    throw new BadRequestException('Van not assigned to this driver');
  }


  const trip = await this.databaseService.repositories.TripModel.findById(tripId);
  if (!trip) {
    throw new NotFoundException('Trip not found');
  }
  
   if (trip.vanId !== van._id.toString()) {
  throw new BadRequestException("Van does not belong to this trip"); // exception throw
}
  // Kids status update
  trip.kids = trip.kids.map(kid => ({
    ...kid,
    status: 'dropped',
    time: time ? new Date(time) : new Date(),
    lat,
    long,
  }));

  // Trip status update
  trip.status = 'end';

  // Trip end info
  trip.tripEnd = {
    endTime: time ? new Date(time) : new Date(),
    lat,
    long,
  };

  await trip.save();
  return {
    data: trip
  };
}


async getLocationByDriver( dto: getLocationDto) {
  const { tripId,  } = dto;


  // 🔍 Step 1: Driver fetch karo




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

  // Step 1: Determine school filter based on userType
  if (userType === "admin") {
    const school = await this.databaseService.repositories.SchoolModel.findOne({ admin: adminObjectId });
    if (!school) throw new UnauthorizedException("School not found");
    schoolFilter = { schoolId: school._id.toString() };
  } else if (userType === "superadmin") {
    // Superadmin sees all trips — no school filter
    schoolFilter = {};
  } else {
    throw new UnauthorizedException("Invalid user type");
  }

  // Step 2: Aggregation pipeline
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
    {
      $addFields: {
        driverId: { $ifNull: [ { $toString: "$driver._id" }, "" ] },
        driverName: { $ifNull: ["$driver.fullname", ""] },
        carNumber: { $ifNull: ["$van.carNumber", ""] }
      }
    },
    {
      $project: {
        van: 0,
        driver: 0
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