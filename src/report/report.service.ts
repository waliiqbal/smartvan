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

  const { kidId, issueType, description, image, dateOfIncident, audio, video, type } = body;

  // Step 1: Kid validate karo (kidId string → ObjectId)
const kid = await this.databaseService.repositories.KidModel.findOne({
  _id: new Types.ObjectId(kidId),
  parentId: new Types.ObjectId(parentId), // agar parentId bhi ObjectId hai to
});
  
  if (!kid) {
    throw new BadRequestException('Kid not found for this parent');
  }

  const schoolId = kid.schoolId;

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
    parentId: parentId,
    schoolId: schoolId,
    type,
    issueType,
    description,
    image,
    dateOfIncident,
    audio,
    video,
    
  });

  await report.save();

  return {
    message: 'Report created successfully',
    data: report,
  };
}

async createDriverReport(body: any, driverId: string) {
  if (!driverId) {
    throw new UnauthorizedException('Invalid driver token');
  }

  const { issueType, description, image, audio , video, type } = body;

  if (!issueType || !description) {
    throw new BadRequestException('Issue type and description are required');
  }

  // Step 1: Driver validate karo
  const driver = await this.databaseService.repositories.driverModel.findById(
    new Types.ObjectId(driverId)
  );

  if (!driver) {
    throw new BadRequestException('Driver not found');
  }

  const schoolId = driver.schoolId
  // Step 2: Report save karo (driver ke related)
  const report = new this.databaseService.repositories.reportModel({
    driverId: driver._id.toString(),
    schoolId: schoolId,
    issueType,
    type,
    description,
    image,
    audio,
    video,
    createdAt: new Date(), // ab dateOfIncident ki jagah current date
  });

  await report.save();

  return {
    message: 'Report submitted successfully by driver',
    data: report,
  };
}

async getReportsForAdmin(adminId: string, page = 1, limit = 10) {
  // 1️⃣ Admin se schoolId nikaalo
  const adminObjectId = new Types.ObjectId(adminId);

  const school = await this.databaseService.repositories.SchoolModel.findOne({
    admin: adminObjectId,
  });

  if (!school) {
    throw new UnauthorizedException('Invalid admin or school not found');
  }

  const schoolId = school._id.toString();
  const skip = (page - 1) * limit;

  // 2️⃣ Pehle total documents count karo
  const total = await this.databaseService.repositories.reportModel.countDocuments({
    schoolId: schoolId
  });

  // 3️⃣ Reports fetch with lookups
  const reports = await this.databaseService.repositories.reportModel.aggregate([
    { $match: { schoolId: schoolId } },

    // 🔹 Lookup driver
    {
      $lookup: {
        from: 'drivers',
        let: { drvId: '$driverId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $ne: ['$$drvId', null] },
                  { $eq: ['$_id', { $toObjectId: '$$drvId' }] }
                ]
              }
            }
          },
          { $project: { fullname: 1 } }
        ],
        as: 'driver'
      }
    },
    { $unwind: { path: '$driver', preserveNullAndEmptyArrays: true } },

    // 🔹 Lookup van
    {
      $lookup: {
        from: 'vans',
        let: { drvId: '$driverId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $ne: ['$$drvId', null] },
                  { $eq: ['$driverId', { $toObjectId: '$$drvId' }] }
                ]
              }
            }
          },
          { $project: { carNumber: 1 } }
        ],
        as: 'van'
      }
    },
    { $unwind: { path: '$van', preserveNullAndEmptyArrays: true } },

    // 🔹 Lookup parent
    {
      $lookup: {
        from: 'parents',
        let: { pId: '$parentId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $ne: ['$$pId', null] },
                  { $eq: ['$_id', { $toObjectId: '$$pId' }] }
                ]
              }
            }
          },
          { $project: { fullname: 1 } }
        ],
        as: 'parent'
      }
    },
    { $unwind: { path: '$parent', preserveNullAndEmptyArrays: true } },

    // 🔹 Lookup kid
    {
      $lookup: {
        from: 'kids',
        let: { kId: '$kidId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $ne: ['$$kId', null] },
                  { $eq: ['$_id', { $toObjectId: '$$kId' }] }
                ]
              }
            }
          },
          { $project: { fullname: 1 } }
        ],
        as: 'kid'
      }
    },
    { $unwind: { path: '$kid', preserveNullAndEmptyArrays: true } },

    // 🔹 Final projection
    {
      $project: {
        _id: 1,
        schoolId: 1,
        issueType: 1,
        description: 1,
        image: 1,
        audio: 1,
        video: 1,
        type: 1,
        dateOfIncident: 1,
        status: 1,
        createdAt: 1,
        driverName: '$driver.fullname',
        vanCarNumber: '$van.carNumber',
        parentName: {
          $cond: [
            { $ne: ['$type', 'DriverReport'] },
            '$parent.fullname',
            '$$REMOVE'
          ]
        },
        kidName: {
          $cond: [
            { $ne: ['$type', 'DriverReport'] },
            '$kid.fullname',
            '$$REMOVE'
          ]
        }
      }
    },

    // ✅ Proper order: sort → skip → limit
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit }
  ]);

  // 4️⃣ Return response with pagination info
  return {
    message: 'Reports fetched successfully',
    data: reports,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}



async changeComplaintStatus(adminId: string, reportId: string, newStatus: string) {
  // 1️⃣ AdminId ko ObjectId me convert karo
  const adminObjectId = new Types.ObjectId(adminId);

  // 2️⃣ School find karo jiska admin ye adminId hai
  const school = await this.databaseService.repositories.SchoolModel.findOne({
    admin: adminObjectId,
  });

  if (!school) {
    throw new UnauthorizedException('Invalid admin or school not found');
  }

  const schoolId = school._id.toString();

  // 3️⃣ Report find karo using reportId + schoolId
  const report = await this.databaseService.repositories.reportModel.findOne({
    _id: new Types.ObjectId(reportId),
    schoolId: schoolId,
  });

  if (!report) {
    throw new BadRequestException('Report not found for this school');
  }

  // 4️⃣ Status update karo (jo front-end se aya hai)
  report.status = newStatus;

  // 5️⃣ Save the updated report
  await report.save();

  return {
    message: 'Report status updated successfully',
   data: report
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
