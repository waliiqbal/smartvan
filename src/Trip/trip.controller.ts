/* eslint-disable prettier/prettier */
import { Body, Controller, Post, Patch, Param } from '@nestjs/common';
import { TripService } from './trip.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { PickStudentDto } from './dto/pick-student.dto';
import { EndTripDto } from './dto/tripend.dto';

@Controller('trips')
export class TripController {
  constructor(private readonly tripService: TripService) {}

  // Start trip endpoint
  @Post('start')
  async startTrip(@Body() createTripDto: CreateTripDto) {
    return this.tripService.startTrip(createTripDto);
  }

  @Patch(':tripId/pick')
async pickStudent(
  @Param('tripId') tripId: string,
  @Body() pickStudentDto: PickStudentDto
) {
  return this.tripService.pickStudent(tripId, pickStudentDto);
}

  @Post('end')
  async endTrip(@Body() dto: EndTripDto) {
    return await this.tripService.endTrip(dto);
  }

}

