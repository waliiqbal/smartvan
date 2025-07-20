/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from "src/database/databaseservice";
import { CreateVanDto } from './dto/create-van.dto';


@Injectable()
export class VanService { 
  constructor(
   
    private databaseService: DatabaseService,

   
  ) {}

  async addVan(createVanDto: CreateVanDto, userId: string, userType: string) {
    // Step 1: Only drivers allowed
    if (userType !== 'driver') {
      throw new UnauthorizedException('Only drivers can add vans');
    }

    // Step 2: Get driver by userId
    const driver = await this.databaseService.repositories.driverModel.findById(userId);
    if (!driver) {
      throw new  UnauthorizedException('Driver not found');
    }

    // Step 3: Create van
    const newVan = new this.databaseService.repositories.VanModel({
      ...createVanDto,
      driverId: driver._id, // 👈 setting driverId from token
    });

    return newVan.save();
  }

  }