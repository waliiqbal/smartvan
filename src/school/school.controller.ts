/* eslint-disable prettier/prettier */
import {
  Controller,
  Post,
  Get,
  Param,
  Patch,
  Delete,
  Body,
  UnauthorizedException,
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

      @Get('getAllSchools')
      async getAllSchools(@Req() req: any) {
        return this.schoolService.getAllSchools();
      }

    @UseGuards(AuthGuard('jwt'))
@Post('changeSchoolStatus')
async changeSchoolStatus(
  @Req() req: any,
  @Body() body: { schoolId: string; status: string },
) {

   if (req.user.role !== 'superadmin') {
      throw new UnauthorizedException('Only superadmins can access this API');
    }
  
  const { schoolId, status } = body;

  return this.schoolService.changeSchoolStatusByAdmin(
    schoolId,
    status,
  );
}

   }


