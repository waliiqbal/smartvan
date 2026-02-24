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
import { Kid } from 'src/Kid/kid.schema';
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
  page: number = 1,
  limit: number = 10,
  status?: string,
  userType?: string,
  driverId?: string,
  schoolId?: string,
  date?: string
) {
  const skip = (page - 1) * limit;
  const matchCondition: any = {};

  // ==============================
  // USER TYPE LOGIC
  // ==============================
  if (userType === "admin") {
    const school = await this.databaseService.repositories.SchoolModel.findOne({
      admin: new Types.ObjectId(AdminId),
    }).lean();

    if (!school) {
      throw new UnauthorizedException("School not found");
    }

    matchCondition.schoolId = school._id.toString();
  } else if (userType === "superadmin") {
    if (schoolId) matchCondition.schoolId = schoolId;
  } else {
    throw new UnauthorizedException("Invalid user type");
  }

  // ==============================
  // STATUS FILTER
  // ==============================
  if (status) {
    matchCondition.status = status;
  }

  // ==============================
  // DATE FILTER (updatedAt day range)
  // ==============================
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    matchCondition.updatedAt = { $gte: startOfDay, $lte: endOfDay };
  }

  // ==============================
  // DRIVER → VAN (SINGLE VAN)
  // ==============================
  if (driverId) {
    const van = await this.databaseService.repositories.VanModel.findOne(
      { driverId: new Types.ObjectId(driverId) },
      { _id: 1 }
    ).lean();

    if (!van) {
      return {
        message: "Trips fetched successfully",
        data: [],
        pagination: { total: 0, page, limit, totalPages: 0 },
      };
    }

    matchCondition.vanId = van._id.toString();
  }

  // ==============================
  // AGGREGATION PIPELINE (NO KIDS LOOKUP)
  // ==============================
  const pipeline: any[] = [
    { $match: matchCondition },

    // VAN LOOKUP
    {
      $lookup: {
        from: "vans",
        let: { vanObjId: { $toObjectId: "$vanId" } },
        pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$vanObjId"] } } }],
        as: "van",
      },
    },
    { $unwind: { path: "$van", preserveNullAndEmptyArrays: true } },

    // DRIVER LOOKUP
    {
      $lookup: {
        from: "drivers",
        localField: "van.driverId",
        foreignField: "_id",
        as: "driver",
      },
    },
    { $unwind: { path: "$driver", preserveNullAndEmptyArrays: true } },

    // ROUTE LOOKUP
    {
      $lookup: {
        from: "routes",
        let: { routeObjId: { $toObjectId: "$routeId" } },
        pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$routeObjId"] } } }],
        as: "route",
      },
    },
    { $unwind: { path: "$route", preserveNullAndEmptyArrays: true } },

    // SCHOOL LOOKUP
    {
      $lookup: {
        from: "schools",
        let: { schoolObjId: { $toObjectId: "$schoolId" } },
        pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$schoolObjId"] } } }],
        as: "school",
      },
    },
    { $unwind: { path: "$school", preserveNullAndEmptyArrays: true } },

    // FINAL FIELDS
    {
      $project: {
        _id: 1,
        status: 1,
        type: 1,
        tripStart: 1,
        tripEnd: 1,
        kids: 1, // keep original kids array (objects)
        locations: 1,
        updatedAt: 1,

        van: {
          _id: "$van._id",
          carNumber: "$van.carNumber",
          vehicleType: "$van.vehicleType",
        },

        driver: {
          _id: "$driver._id",
          fullname: "$driver.fullname",
          phoneNo: "$driver.phoneNo",
        },

        route: {
          _id: "$route._id",
          title: "$route.title",
          tripType: "$route.tripType",
        },

        schoolName: "$school.schoolName",
        contactNumber: "$school.contactNumber",
      },
    },

    { $sort: { updatedAt: -1 } },
    { $skip: skip },
    { $limit: limit },
  ];

  // ==============================
  // EXECUTE
  // ==============================
  const trips = await this.databaseService.repositories.TripModel.aggregate(pipeline);

  const total = await this.databaseService.repositories.TripModel.countDocuments(matchCondition);

  // ==============================
  // KIDS ENRICHMENT (MAP APPROACH)
  // kids: [{ kidId: "string", lat,long,time,status }]
  // ==============================
  const allKidIds: string[] = trips.flatMap((t: any) =>
    Array.isArray(t.kids) ? t.kids.map((k: any) => k?.kidId).filter(Boolean) : []
  );

  const uniqueKidIds = [...new Set(allKidIds)]
    .filter((id) => Types.ObjectId.isValid(id)); // safe check

  // If no kids, return as-is
  if (uniqueKidIds.length === 0) {
    return {
      message: "Trips fetched successfully",
      data: trips,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Fetch kids details once
  const kidsDetails = await this.databaseService.repositories.KidModel.find(
    { _id: { $in: uniqueKidIds.map((id) => new Types.ObjectId(id)) } },
    { fullname: 1, image: 1 }
  ).lean();

  const kidMap = new Map<string, any>(
    kidsDetails.map((k: any) => [k._id.toString(), k])
  );

  // Merge into trips.kids
  const updatedTrips = trips.map((trip: any) => ({
    ...trip,
    kids: Array.isArray(trip.kids)
      ? trip.kids.map((k: any) => {
          const kd = k?.kidId ? kidMap.get(k.kidId) : null;
          return {
            ...k,
            fullname: kd?.fullname ?? null,
            image: kd?.image ?? null,
          };
        })
      : [],
  }));

  return {
    message: "Trips fetched successfully",
    data: updatedTrips,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
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