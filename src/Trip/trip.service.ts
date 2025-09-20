/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PickStudentDto } from './dto/pick-student.dto';
import mongoose from 'mongoose';
import { Types } from 'mongoose';




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

  // 🔍 Step 3: Trip create karo
  const newTrip = new this.databaseService.repositories.TripModel({
    driverId: driverId,
    vanId: van._id.toString(),
    schoolId: van.schoolId,

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
    lat: dto.lat,
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


async getLocationByDriver(driverId, dto: getLocationDto) {
  const { tripId,  } = dto;

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

// ✅ Sirf required fields return karo
  return {
    data: {
      type: trip.type,
      status: trip.status,
      locations: trip.locations,
    },
  };
}

}