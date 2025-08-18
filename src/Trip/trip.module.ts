/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';


import { TripService } from './trip.service';
import { TripController } from './trip.controller';

@Module({
  
  controllers: [TripController],
  providers: [TripService],
  exports: [TripService] // agar kahin aur use karna ho to
})
export class TripModule {}