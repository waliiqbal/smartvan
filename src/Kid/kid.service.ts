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
  // Step 1: Only parents allowed
  if (userType !== 'parent') {
    throw new UnauthorizedException('Only parent can add kids');
  }

  // Step 2: Get parent by userId
  const Parent = await this.databaseService.repositories.parentModel.findById(userId);
  if (!Parent) {
    throw new UnauthorizedException('Parent not found');
  }

  // Step 3: Create kid
  const newKid = new this.databaseService.repositories.KidModel({
    ...CreateKidDto,
    parentId: Parent._id,
  });

  const savedKid = await newKid.save();

  // Step 4: Wrap response in "data"
  return {
    message: 'Kid added successfully',
    data: savedKid,
  };
}

async getKids(userId: string, userType: string) {
  // Step 1: Sirf parent access kare
  if (userType !== 'parent') {
    throw new UnauthorizedException('Only parent can view their kids');
  }

  // Step 2: Parent find karo (ensure parent exists)
  const parent = await this.databaseService.repositories.parentModel.findById(userId);
  if (!parent) {
    throw new UnauthorizedException('Parent not found');
  }

  // Step 3: Parent ID se bachay fetch karo
  const kids = await this.databaseService.repositories.KidModel.find({ parentId: parent._id });

  // Step 4: Response wrap in data
  return {
    message: 'Kids fetched successfully',
    data: kids,
  };
}
}