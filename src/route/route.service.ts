/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DatabaseService } from 'src/database/databaseservice';
import { Types } from 'mongoose';
import { CreateRouteDto } from './dto/createRoutedto';


@Injectable()
export class RouteService {
  constructor(
  private databaseService: DatabaseService,
  ) {}

  async createRoute(dto: CreateRouteDto, adminId: string) {
    console.log(adminId)
    
   const adminObjectId = new Types.ObjectId(adminId);
   console.log(adminObjectId)

  // Step 1: find school
  const school = await this.databaseService.repositories.SchoolModel.findOne({ admin: adminObjectId });
  if (!school) {
    throw new UnauthorizedException("School not found");
  }

   
    const schoolIdString = school._id.toString();


    const newRoute = await this.databaseService.repositories.routeModel.create({
      ...dto,
      schoolId: schoolIdString,
    });
   return {
      success: true,
      message: "Route created successfully",
      data: newRoute
  };

  }

  async getAssignedTripByDriver(driverId: string) {
  if (!driverId) {
    throw new UnauthorizedException('Invalid driver token');
  }

  // Step 1: Driver find karo (sirf name lo)
  const driver = await this.databaseService.repositories.driverModel.findById(
    new Types.ObjectId(driverId),
    { fullname: 1 }
  );

  if (!driver) {
    throw new BadRequestException('Driver not found');
  }

  // Step 2: Van find karo driverId se
  const van = await this.databaseService.repositories.VanModel.findOne({
    driverId: new Types.ObjectId(driverId),
  },
   { assignRoute: 1 , carNumber: 1  }
);

  if (!van) {
    throw new BadRequestException('Van not found for this driver');
  }

  // Step 3: Route find karo based on vanId (string comparison)
  const route = await this.databaseService.repositories.routeModel.findOne({
    vanId: van._id.toString(),
  });

  if (!route) {
    throw new BadRequestException('No route assigned to this van');
  }

  // ✅ Step 3.1: Check if today is active trip day (Pakistan timezone)
const today = new Date().toLocaleString('en-US', { 
  weekday: 'long', 
  timeZone: 'Asia/Karachi'   // Pakistan timezone set kiya
}).toLowerCase();  
// e.g. 'monday', 'tuesday', etc.

if (!route.tripDays?.[today]) {
  // agar aaj ka din tripDays me false ya undefined hai
  return {
    message: 'No active trip today',
    data: null,
  };
}


  // Step 4: School find karo (schoolId route me string hai)
  const school = await this.databaseService.repositories.SchoolModel.findById(
    new Types.ObjectId(route.schoolId),
    {  contactNumber: 1 }
  );

  if (!school) {
    throw new BadRequestException('school not found');
  }
  // Step 5: Kids count nikaalo (van._id se)
  const totalKids = await this.databaseService.repositories.KidModel.countDocuments({
    VanId: van._id,
  });

  // Step 6: Response ready karo
  return {
    message: 'Assigned trip fetched successfully',
    data: {
      driverName: driver.fullname,
      vehicleType: van.vehicleType,
      vehicleNumber: van.carNumber,
      routeTitle: route.title,
      tripType: route.tripType,
      startTime: route.startTime,
      
      schoolContact: school?.contactNumber || null,
      totalKids,
    },
  };
}

async getAllRoutesByAdmin(adminId: string, page = 1, limit = 10) {
  const adminObjectId = new Types.ObjectId(adminId);

  // Step 1: Find school by adminId
  const school = await this.databaseService.repositories.SchoolModel.findOne({ admin: adminObjectId });
  if (!school) {
    throw new UnauthorizedException("School not found");
  }

  const schoolIdString = school._id.toString();
  const skip = (page - 1) * limit;

  // Step 2: Aggregation pipeline
  const routes = await this.databaseService.repositories.routeModel.aggregate([
    // Match by school
    { $match: { schoolId: schoolIdString } },

    // Convert vanId (string) to ObjectId and lookup van details
    {
      $lookup: {
        from: "vans",
        let: { vanIdObj: { $toObjectId: "$vanId" } },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$vanIdObj"] } } },
          { $project: { _id: 1, carNumber: 1, driverId: 1 } }
        ],
        as: "vanDetails"
      }
    },
    { $unwind: { path: "$vanDetails", preserveNullAndEmptyArrays: true } },

    // Lookup driver by vanDetails.driverId
    {
      $lookup: {
        from: "drivers",
        let: { drvId: "$vanDetails.driverId" },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$drvId"] } } },
          { $project: { _id: 1, fullname: 1 } }
        ],
        as: "driverDetails"
      }
    },
    { $unwind: { path: "$driverDetails", preserveNullAndEmptyArrays: true } },

    // Select fields to return
    {
      $project: {
        _id: 1,
        title: 1,
        tripType: 1,
        startTime: 1,
        startPoint: 1,
        endPoint: 1,
        tripDays: 1,
        vanId: 1,
        "vanDetails._id": 1,
        "vanDetails.carNumber": 1,
        "driverDetails._id": 1,
        "driverDetails.fullname": 1,
        createdAt: 1,
        updatedAt: 1,
      }
    },

    // Pagination
    { $skip: skip },
    { $limit: limit },
  ]);

  // Step 3: Count total
  const totalRoutes = await this.databaseService.repositories.routeModel.countDocuments({
    schoolId: schoolIdString,
  });

  // Step 4: Return final paginated result
  return {
    message: "All routes fetched successfully",
    data: {
    totalRoutes,
    currentPage: page,
    totalPages: Math.ceil(totalRoutes / limit),
    routes,
    }
  };
}

async getRouteById(adminId: string, routeId: string) {
  const adminObjectId = new Types.ObjectId(adminId);

  // Step 1: Find school by adminId
  const school = await this.databaseService.repositories.SchoolModel.findOne({ admin: adminObjectId });
  if (!school) {
    return {
      success: false,
      message: "School not found",
    };
  }

  const schoolIdString = school._id.toString();

  // Step 2: Find route by routeId + schoolId
  const route = await this.databaseService.repositories.routeModel.findOne({
    _id: new Types.ObjectId(routeId),
    schoolId: schoolIdString,
  });

  if (!route) {
    return {
      success: false,
      message: "Route not found",
    };
  }

 
  const van = await this.databaseService.repositories.VanModel.findOne({
    _id: new Types.ObjectId(route.vanId),
  });


  let driver = null;
  if (van?.driverId) {
    driver = await this.databaseService.repositories.driverModel.findById(van.driverId);
  }

  // Step 5: Final combined data
  const finalData = {
    _id: route._id,
    title: route.title,
    tripType: route.tripType,
    startTime: route.startTime,
    startPoint: route.startPoint,
    endPoint: route.endPoint,
    tripDays: route.tripDays,
    vanId: route.vanId,
    carNumber: van ? van.carNumber : null,
    driverName: driver ? driver.fullname : null,
    createdAt: (route as any).createdAt,
     updatedAt: (route as any).updatedAt,
  };

  return {
    success: true,
    message: "Route fetched successfully",
    data: finalData,
  };
}

// async editRoute(adminId: string, routeId: string, dto: CreateRouteDto) {
//   const adminObjectId = new Types.ObjectId(adminId);

//   // Step 1: Find school by adminId
//   const school = await this.databaseService.repositories.SchoolModel.findOne({ admin: adminObjectId });
//   if (!school) {
//     throw new UnauthorizedException("School not found");
//   }

//   const schoolIdString = school._id.toString();

//   // Step 2: Verify route belongs to this school
//   const existingRoute = await this.databaseService.repositories.routeModel.findOne({
//     _id: new Types.ObjectId(routeId),
//     schoolId: schoolIdString,
//   });

//   if (!existingRoute) {
//     throw new BadRequestException("Route not found for this school");
//   }

//   // Step 3: Update route using DTO fields
//   const updatedRoute = await this.databaseService.repositories.routeModel.findByIdAndUpdate(
//     routeId,
//     { $set: { ...dto } },
//     { new: true } // Return updated document
//   );

//   return {
//     success: true,
//     message: "Route updated successfully",
//     data: updatedRoute,
//   };
// }

async editRoute(adminId: string, routeId: string, dto: CreateRouteDto) {
  const adminObjectId = new Types.ObjectId(adminId);

  // Step 1: Find school by adminId
  const school = await this.databaseService.repositories.SchoolModel.findOne({ admin: adminObjectId });
  if (!school) {
    throw new UnauthorizedException("School not found");
  }

  const schoolIdString = school._id.toString();

  // Step 2: Verify route belongs to this school
  const existingRoute = await this.databaseService.repositories.routeModel.findOne({
    _id: new Types.ObjectId(routeId),
    schoolId: schoolIdString,
  });
  if (!existingRoute) {
    throw new BadRequestException("Route not found for this school");
  }

  // Step 3: Flatten nested objects to dot-notation
  const updateData: Record<string, any> = {};

  // Normal top-level keys
  const simpleFields = ['schoolId', 'vanId', 'title', 'startTime', 'tripType'];
  for (const key of simpleFields) {
    if (dto[key] !== undefined) updateData[key] = dto[key];
  }

  // Nested: tripDays
  if (dto.tripDays) {
    for (const [day, value] of Object.entries(dto.tripDays)) {
      updateData[`tripDays.${day}`] = value;
    }
  }

  // Nested: startPoint
  if (dto.startPoint) {
    for (const [coord, value] of Object.entries(dto.startPoint)) {
      updateData[`startPoint.${coord}`] = value;
    }
  }

  // Nested: endPoint
  if (dto.endPoint) {
    for (const [coord, value] of Object.entries(dto.endPoint)) {
      updateData[`endPoint.${coord}`] = value;
    }
  }

  // Step 4: Perform partial update safely
  const updatedRoute = await this.databaseService.repositories.routeModel.findByIdAndUpdate(
    routeId,
    { $set: updateData },
    { new: true }
  );

  return {
    success: true,
    message: "Route updated successfully",
    data: updatedRoute,
  };
}



}

