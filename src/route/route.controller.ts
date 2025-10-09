/* eslint-disable prettier/prettier */

import { Controller, Post, Body, Req, Get } from '@nestjs/common';
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

  }