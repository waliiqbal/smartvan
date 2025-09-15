/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DatabaseService } from 'src/database/databaseservice';
import { Types } from 'mongoose';


@Injectable()
export class ReportService {
  constructor(
  private databaseService: DatabaseService,
  ) {}

 async createReport(body: any, parentId: string) {
  if (!parentId) {
    throw new UnauthorizedException('Invalid parent token');
  }

  const { kidId, issueType, description, image, dateOfIncident } = body;

  // Step 1: Kid validate karo (kidId string → ObjectId)
const kid = await this.databaseService.repositories.KidModel.findOne({
  _id: new Types.ObjectId(kidId),
  parentId: new Types.ObjectId(parentId), // agar parentId bhi ObjectId hai to
});
  
  if (!kid) {
    throw new BadRequestException('Kid not found for this parent');
  }

  // Step 2: Van aur Driver nikalna
  let driverId: string | null = null;
  if (kid.VanId) {
    // kid.vanId string → ObjectId
    const van = await this.databaseService.repositories.VanModel.findById(
      new Types.ObjectId(kid.VanId),
    );

    if (van && van.driverId) {
      // ObjectId → string
      driverId = van.driverId.toString();
    }
  }

  // Step 3: Report save karna (kidId & driverId string me save honge)
  const report = new this.databaseService.repositories.reportModel({
    kidId: kid._id.toString(),
    driverId: driverId,
    issueType,
    description,
    image,
    dateOfIncident,
  });

  await report.save();

  return {
    message: 'Report created successfully',
    data: report,
  };
}

async addFaq(data: any) {
    // check if already exists (sirf ek hi document chahiye)
    const existing = await this.databaseService.repositories.FAQModel.findOne();
    if (existing) {
      throw new BadRequestException('FAQ document already exists. Please update instead.');
    }

    const faq = new this.databaseService.repositories.FAQModel(data);
    return faq.save();
  }

   async getFaq(): Promise<any> {
    const faq = await this.databaseService.repositories.FAQModel.findOne(); // sirf ek hi document hai
    if (!faq) {
      throw new BadRequestException('FAQ document not found');
    }

    return {
      data: faq,   // 👈 response wrap in "data"
    };
  }


}
