/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from "src/database/databaseservice";
import { OtpService } from 'src/user/schema/otp/otp.service';
import { SchoolDocument } from './school.schema';
import { Types } from 'mongoose';
import mongoose from 'mongoose';



@Injectable()
export class SchoolService {
  
  constructor(
   
    private databaseService: DatabaseService,
    private readonly otpService: OtpService, 

    private readonly jwtService: JwtService
  ) {}

  async getkidsProfile(userId: string) {
    console.log(userId)
    try {
      if (!userId ) {
        throw new UnauthorizedException('Invalid user credentials');
      }
  const school: SchoolDocument | null = await this.databaseService.repositories.SchoolModel.findOne({
    admin: new Types.ObjectId(userId)
  });

  console.log(school)

  if (!school) {
    throw new UnauthorizedException('School not found');
  }

  const schoolId = school._id.toString();
  
   console.log(schoolId, "wali")
  const kids = await this.databaseService.repositories.KidModel.find({
  schoolId: schoolId
});
 
  console.log(kids)
  

     if (!kids) {
        throw new UnauthorizedException('kids not found');
      }
  
    

      // ✅ 3. Wrap response in data
      return {
        message: 'kids fetched successfully',
        data: kids,
      };
    } catch (error) {
      throw new UnauthorizedException(error.message || 'Failed to fetch kids');
    }
  }

   async getVansProfile(userId: string) {
  
    try {
      if (!userId ) {
        throw new UnauthorizedException('Invalid user credentials');
      }
  const school: SchoolDocument | null = await this.databaseService.repositories.SchoolModel.findOne({
    admin: new Types.ObjectId(userId)
  });

 

  if (!school) {
    throw new UnauthorizedException('School not found');
  }

  const schoolId = school._id.toString();
     console.log(schoolId, "wali")
  
   
  const vans = await this.databaseService.repositories.VanModel.find({
  schoolId: schoolId
});

console.log(vans)
 
 
  

     if (!vans) {
        throw new UnauthorizedException('kids not found');
      }
  
    

      // ✅ 3. Wrap response in data
      return {
        message: 'vans fetched successfully',
        data: vans,
      };
    } catch (error) {
      throw new UnauthorizedException(error.message || 'Failed to fetch kids');
    }
  }


    async getDriversProfile(userId: string) {
     try {
      if (!userId ) {
        throw new UnauthorizedException('Invalid user credentials');
      }
  const school: SchoolDocument | null = await this.databaseService.repositories.SchoolModel.findOne({
    admin: new Types.ObjectId(userId)
  });

 

  if (!school) {
    throw new UnauthorizedException('School not found');
  }

  const schoolId = school._id.toString();
     console.log(schoolId, "wali")
  
   
  const drivers = await this.databaseService.repositories.driverModel.find({
  schoolId: schoolId
});


 
  

     if (!drivers) {
        throw new UnauthorizedException('drivers not found');
      }
  
    

      // ✅ 3. Wrap response in data
      return {
        message: 'drivers fetched successfully',
        data: drivers,
      };
    } catch (error) {
      throw new UnauthorizedException(error.message || 'Failed to fetch drivers');
    }
  }

  }