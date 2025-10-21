/* eslint-disable prettier/prettier */

import { Controller, Post, Body, Req, Get, Query, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UseGuards } from '@nestjs/common';
import { RouteService } from './route.service'
import { CreateRouteDto } from './dto/createRoutedto';


@Controller('Route')
export class routeController {
  constructor(private readonly routetService: RouteService) {}


 @UseGuards(AuthGuard('jwt'))
  @Post("createRoute")
async createRoute(@Body() dto: CreateRouteDto, @Req() req) {
  const adminId = req.user.userId; // token se admin ka id
  return this.routetService.createRoute(dto, adminId);
}

@UseGuards(AuthGuard('jwt'))
@Get('getAssignedTripByDriver')
async getAssignedTripByDriver(@Req() req: any) {
  const driverId = req.user.userId; // token se driverId nikli
  return this.routetService.getAssignedTripByDriver(driverId);
}

@UseGuards(AuthGuard('jwt')) // JWT protection
@Get('getRoutes')
async getRoutes(
  @Req() req: any, // JWT se user info aayega
  @Query('page') page: string,
  @Query('limit') limit: string,
) {
  // JWT se adminId nikal lo
  const adminId = req.user.userId;

  if (!adminId) {
    throw new NotFoundException ('Admin not found in token');
  }

  // pagination values parse karo
  const pageNumber = page ? parseInt(page) : 1;
  const limitNumber = limit ? parseInt(limit) : 10;

  // service function call with pagination
  return this.routetService.getAllRoutesByAdmin(adminId, pageNumber, limitNumber);


}


  }