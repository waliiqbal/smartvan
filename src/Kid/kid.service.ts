/* eslint-disable prettier/prettier */
import { BadGatewayException, Injectable, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from "src/database/databaseservice";
import { CreateKidDto } from './dto/CreateKid.dto';
import { Types } from 'mongoose';
import mongoose from 'mongoose';
import { FirebaseAdminService } from 'src/notification/firebase-admin.service';




@Injectable()
export class KidService { 
  constructor(
   
    private databaseService: DatabaseService,
    private firebaseAdminService: FirebaseAdminService

   
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

async assignVanToStudent(kidId: string, vanId: string, adminId: string) {
  const adminObjectId = new Types.ObjectId(adminId);
  

  // Step 1: Find school by adminId
  const school = await this.databaseService.repositories.SchoolModel.findOne({ admin: adminObjectId });
  console.log(school._id)

  if (!school) {
    throw new UnauthorizedException('School not found');
  }

  const schoolIdString = school._id.toString();
  console.log(schoolIdString)



  // Step 2: Find kid by id
  const kid = await this.databaseService.repositories.KidModel.findOne({ _id: kidId, schoolId: schoolIdString });
 

  if (!kid) {
    throw new BadGatewayException('Kid not found in this school');
  }

  // Step 3: Check if van already assigned
  if (kid.VanId) {
    return {
      message: 'Van already assigned to this student',
      
    };
  }

  // Step 4: Assign new van
  kid.VanId = vanId;
  const updatedKid = await kid.save();

  return {
    message: 'Van assigned successfully',
    data: updatedKid,
  };
}

async verifyStudentByAdmin(kidId: string, adminId: string) {
  const adminObjectId = new Types.ObjectId(adminId);
  

  // Step 1: Find school by adminId
  const school = await this.databaseService.repositories.SchoolModel.findOne({ admin: adminObjectId });
  console.log(school._id)

    const schoolIdString = school._id.toString();

  if (!school) {
    throw new UnauthorizedException('School not found');
  }

  // Step 2: Find kid by id + schoolId
  const kid = await this.databaseService.repositories.KidModel.findOne({ _id: kidId, schoolId: schoolIdString  });

  if (!kid) {
    throw new BadGatewayException('Kid not found in this school');
  }

  // Step 3: Check if already verified
  if (kid.verifiedBySchool === true) {
    return {
      message: 'Student already verified',
      data: kid,
    };
  }

  // Step 4: Verify student
  kid.verifiedBySchool = true;
  const updatedKid = await kid.save();

   const parent = await this.databaseService.repositories.parentModel.findById(kid.parentId);

if (!parent?.fcmToken) {
  return {
    message: 'FCM token not found for this parent',
    success: false,
  };
}

const payload = {
  notification: {
    title: 'Student Verified',
    body: 'Your kid has been successfully verified by the school.',
  },
  data: {
    actionType: 'STUDENT_VERIFIED', // frontend ke liye useful
  },
};

// 🔹 Send push notification + save in DB
await this.firebaseAdminService.sendToDevice(parent.fcmToken, payload, {
  parentId: kid.parentId.toString(),
  actionType: 'STUDENT_VERIFIED',
});
  return {
    message: 'Student verified successfully',
    data: updatedKid,
  };
}

}