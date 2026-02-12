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

  
const kid = await this.databaseService.repositories.KidModel.findOne({
  _id: new Types.ObjectId(kidId),
  parentId: new Types.ObjectId(parentId), // agar parentId bhi ObjectId hai to
});
  
  if (!kid) {
    throw new BadRequestException('Kid not found for this parent');
  }

  const schoolId = kid.schoolId;


  let driverId: string | null = null;
  if (kid.VanId) {
 
    const van = await this.databaseService.repositories.VanModel.findById(
      new Types.ObjectId(kid.VanId),
    );

    if (van && van.driverId) {
  
      driverId = van.driverId.toString();
    }
  }


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

 
  const driver = await this.databaseService.repositories.driverModel.findById(
    new Types.ObjectId(driverId)
  );

  if (!driver) {
    throw new BadRequestException('Driver not found');
  }

  const schoolId = driver.schoolId
 
  const report = new this.databaseService.repositories.reportModel({
    driverId: driver._id.toString(),
    schoolId: schoolId,
    issueType,
    type,
    description,
    image,
    audio,
    video,
    createdAt: new Date(), 
  });

  await report.save();

  return {
    message: 'Report submitted successfully by driver',
    data: report,
  };
}


  async getReportsForAdmin(
    adminId: string,
    userType: string,
    query: any,
  ) {
    const adminObjectId = new Types.ObjectId(adminId);

    // Pagination
    const page = Math.max(1, parseInt(query.page as string, 10) || 1);
    const limit = Math.max(1, parseInt(query.limit as string, 10) || 10);
    const skip = (page - 1) * limit;

    // Filters
   const status = typeof query.status === "string" ? query.status.trim() : "";
const typeFilter = typeof query.type === "string" ? query.type.trim() : "";

    let matchFilter: any = {};


    if (userType === "admin") {
      const school = await this.databaseService.repositories.SchoolModel.findOne({
        admin: adminObjectId,
      });

      if (!school) throw new UnauthorizedException("Invalid admin or school not found");
      matchFilter.schoolId = school._id.toString();
    } else if (userType === "superadmin") {
      matchFilter = {}; // no restriction
    } else {
      throw new UnauthorizedException("Invalid user type");
    }


    if (typeFilter && ["driverReport", "parentReport"].includes(typeFilter)) {
      matchFilter.type = typeFilter;
    }

 
    if (status) {
      matchFilter.status = status;
    }

  
    const total = await this.databaseService.repositories.reportModel.countDocuments(matchFilter);

    // Aggregation pipeline
    const reports = await this.databaseService.repositories.reportModel.aggregate([
      { $match: matchFilter },

   
      {
        $lookup: {
          from: "drivers",
          let: { drvId: "$driverId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $ne: ["$$drvId", null] },
                    { $eq: ["$_id", { $toObjectId: "$$drvId" }] },
                  ],
                },
              },
            },
            { $project: { fullname: 1 } },
          ],
          as: "driver",
        },
      },
      { $unwind: { path: "$driver", preserveNullAndEmptyArrays: true } },

      // Van lookup
      {
        $lookup: {
          from: "vans",
          let: { drvId: "$driverId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $ne: ["$$drvId", null] },
                    { $eq: ["$driverId", { $toObjectId: "$$drvId" }] },
                  ],
                },
              },
            },
            { $project: { carNumber: 1 } },
          ],
          as: "van",
        },
      },
      { $unwind: { path: "$van", preserveNullAndEmptyArrays: true } },

      // Parent lookup
      {
        $lookup: {
          from: "parents",
          let: { pId: "$parentId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $ne: ["$$pId", null] },
                    { $eq: ["$_id", { $toObjectId: "$$pId" }] },
                  ],
                },
              },
            },
            { $project: { fullname: 1 } },
          ],
          as: "parent",
        },
      },
      { $unwind: { path: "$parent", preserveNullAndEmptyArrays: true } },

      // Kid lookup
      {
        $lookup: {
          from: "kids",
          let: { kId: "$kidId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $ne: ["$$kId", null] },
                    { $eq: ["$_id", { $toObjectId: "$$kId" }] },
                  ],
                },
              },
            },
            { $project: { fullname: 1 } },
          ],
          as: "kid",
        },
      },
      { $unwind: { path: "$kid", preserveNullAndEmptyArrays: true } },

      // School lookup
      {
        $lookup: {
          from: "schools",
          let: { sId: "$schoolId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $ne: ["$$sId", null] },
                    { $ne: ["$$sId", ""] },
                    { $eq: ["$_id", { $toObjectId: "$$sId" }] },
                  ],
                },
              },
            },
            { $project: { name: 1 } },
          ],
          as: "school",
        },
      },
      { $unwind: { path: "$school", preserveNullAndEmptyArrays: true } },

      // Final projection
      {
        $project: {
          _id: 1,
          schoolId: 1,
          schoolName: "$school.name",
          issueType: 1,
          description: 1,
          image: 1,
          audio: 1,
          video: 1,
          type: 1,
          dateOfIncident: 1,
          status: 1,
          createdAt: 1,
          driverName: "$driver.fullname",
          vanCarNumber: "$van.carNumber",
          parentName: { $cond: [{ $ne: ["$type", "driverReport"] }, "$parent.fullname", "$$REMOVE"] },
          kidName: { $cond: [{ $ne: ["$type", "driverReport"] }, "$kid.fullname", "$$REMOVE"] },
        },
      },

      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    // Return paginated response
    return {
      message: "Reports fetched successfully",
      data: reports,
      userType,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }







async changeComplaintStatus(adminId: string, reportId: string, newStatus: string, adminRemarks?: string ) {
  // 1️⃣ AdminId ko ObjectId me convert karo
  const adminObjectId = new Types.ObjectId(adminId);

  
  const school = await this.databaseService.repositories.SchoolModel.findOne({
    admin: adminObjectId,
  });

  if (!school) {
    throw new UnauthorizedException('Invalid admin or school not found');
  }

  const schoolId = school._id.toString();

 
  const report = await this.databaseService.repositories.reportModel.findOne({
    _id: new Types.ObjectId(reportId),
    schoolId: schoolId,
  });

  if (!report) {
    throw new BadRequestException('Report not found for this school');
  }


  report.status = newStatus;
  report.adminRemarks = adminRemarks

  await report.save();

  return {
    message: 'Report status updated successfully',
   data: report
  };
}



async addFaq(data: any) {

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
