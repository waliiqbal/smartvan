/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PickStudentDto } from './dto/pick-student.dto';
import mongoose from 'mongoose';
import { Types } from 'mongoose';


import { CreateTripDto } from './dto/create-trip.dto';
import { DatabaseService } from "src/database/databaseservice";

@Injectable()
export class TripService {
  constructor(
   private databaseService: DatabaseService,
  ) {} 

  async startTrip(createTripDto: CreateTripDto) {
  const newTrip = new this.databaseService.repositories.TripModel({
    vanId: createTripDto.vanId,
    schoolId: createTripDto.schoolId,

    type: createTripDto.type || undefined,

    tripStart: {
      startTime: createTripDto.tripStart?.startTime || new Date(),
      lat: createTripDto.tripStart?.lat,
      long: createTripDto.tripStart?.long,
    },

    status: createTripDto.status || 'start',

    kids: [],

    // Start trip pe sirf ek location save hogi agar bheji ho
    locations: createTripDto.locations?.length
      ? [{
          lat: createTripDto.locations[0].lat,
          long: createTripDto.locations[0].long,
          time: createTripDto.locations[0].time || new Date()
        }]
      : [],
  });

  return await newTrip.save();
}


async pickStudent(tripId: string, dto: PickStudentDto) {
  const trip = await this.databaseService.repositories.TripModel.findById(tripId);
  if (!trip) {
    throw new NotFoundException('Trip not found');
  }

  // Push new kid pickup data
  trip.kids.push({
   kidId: new  Types.ObjectId(dto.kidId),
    lat: dto.lat,
    long: dto.long,
    time: dto.time || new Date(),
    status: 'picked',
  });

  // If trip status is "start", change to "ongoing"
  if (trip.status === 'start') {
    trip.status = 'ongoing';
  }

  await trip.save();
  return trip;
}

}