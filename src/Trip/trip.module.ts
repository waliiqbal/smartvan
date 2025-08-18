/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Trip, TripSchema } from './schema/trip.schema';
import { TripService } from './trip.service';
import { TripController } from './trip.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Trip.name, schema: TripSchema }])
  ],
  controllers: [TripController],
  providers: [TripService],
  exports: [TripService] // agar kahin aur use karna ho to
})
export class TripModule {}