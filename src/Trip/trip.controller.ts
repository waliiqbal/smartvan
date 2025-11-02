/* eslint-disable prettier/prettier */
import { Body, Controller, Post, Patch, Param,Query, Req, Get, UnauthorizedException } from '@nestjs/common';
import { TripService } from './trip.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { PickStudentDto } from './dto/pick-student.dto';
import { EndTripDto } from './dto/tripend.dto';
import { AuthGuard } from '@nestjs/passport';
import { UseGuards } from '@nestjs/common';
import { getLocationDto } from './dto/getLocations';

@Controller('trips')
export class TripController {
  constructor(private readonly tripService: TripService) {}

  // Start trip endpoint
  @UseGuards(AuthGuard('jwt'))
  @Post('startTrip')
  async startTrip(@Body() createTripDto: CreateTripDto,
  @Req() req: any,
) {
  const driverId = req.user.userId;
    return this.tripService.startTrip(driverId,createTripDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('pickStudent')
async pickStudent(
 
  @Body() pickStudentDto: PickStudentDto,
   @Req() req: any,
  
) {

   const driverId = req.user.userId;
  return this.tripService.pickStudent( driverId,pickStudentDto);
}

  @UseGuards(AuthGuard('jwt'))
  @Post('endTrip')
  async endTrip(@Body() dto: EndTripDto,  @Req() req: any,) {
     const driverId = req.user.userId;
    return await this.tripService.endTrip(driverId,dto);
  }


  @Get('getLocation')
  async getLocationsByDriver(@Body() dto: getLocationDto,  @Req() req: any,) {
 
    return await this.tripService.getLocationByDriver( dto);
  
}

@UseGuards(AuthGuard('jwt'))
@Get("Get-Trips-By-Admin")
async getTrips(
  @Req() req: any,
  @Query('page') page: string,
  @Query('limit') limit: string,
  @Query('status') status?: string, // start | ongoing | end
) {
  const adminId = req.user.userId;
  if (!adminId) throw new UnauthorizedException("Admin not found in token");

  const pageNumber = page ? parseInt(page) : 1;
  const limitNumber = limit ? parseInt(limit) : 10;

  return this.tripService.getTripsByAdmin(adminId, pageNumber, limitNumber, status);
}

}

