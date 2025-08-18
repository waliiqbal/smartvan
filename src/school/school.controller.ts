/* eslint-disable prettier/prettier */
import {
  Controller,
  Post,
  Get,
  Param,
  Patch,
  Delete,
  Body,
  Req
} from '@nestjs/common';
import { SchoolService } from './school.service'
import { AuthGuard } from '@nestjs/passport';
import { UseGuards } from '@nestjs/common';


@Controller('school')
export class SchoolController {
  constructor(private readonly  schoolService: SchoolService) {}

   @UseGuards(AuthGuard('jwt'))
        @Get('getKidsProfile')
      async getKids(@Req() req: any) {
        const userId  = req.user.userId; 
        return this.schoolService.getkidsProfile(userId);
      }

       @UseGuards(AuthGuard('jwt'))
        @Get('getVansProfile')
      async getVans(@Req() req: any) {
        const userId  = req.user.userId; 
        return this.schoolService.getVansProfile(userId);
      }
   
      @UseGuards(AuthGuard('jwt'))
        @Get('getDriversProfile')
      async getDrivers(@Req() req: any) {
        const userId  = req.user.userId; 
        return this.schoolService.getDriversProfile(userId);
      }
   }


