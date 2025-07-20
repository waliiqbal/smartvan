/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from "src/database/databaseservice";
import { CreateKidDto } from './dto/CreateKid.dto';



@Injectable()
export class KidService { 
  constructor(
   
    private databaseService: DatabaseService,

   
  ) {}

  
    async addKid(CreateKidDto: CreateKidDto, userId: string, userType: string) {
      // Step 1: Only drivers allowed
      if (userType !== 'parent') {
        throw new UnauthorizedException('Only parent can add kids');
      }
  
      // Step 2: Get driver by userId
      const Parent = await this.databaseService.repositories.parentModel.findById(userId);
      if (!Parent) {
        throw new  UnauthorizedException('parent not found');
      }
  
      // Step 3: Create van
      const newVan = new this.databaseService.repositories.KidModel({
        ...CreateKidDto,
         parentId: Parent._id,
      });
  
      return newVan.save();
    }
}