/* eslint-disable prettier/prettier */
import { BadRequestException, Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from "src/database/databaseservice";
import { CreateVanDto } from './dto/create-van.dto';
import { OtpService } from 'src/user/schema/otp/otp.service';
import { EditVanByAdminDto } from './dto/editVanByAdmin.dto';
import { CreateVanByAdminDto } from './dto/createVanByAdmin.dto';
import { Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { EditDriverDto } from './dto/editDriver.dto';
import { title } from 'process';
import { Admin } from 'src/admin/admin.schema';

@Injectable()
export class VanService { 
  constructor(
   
    private databaseService: DatabaseService,
    private  OtpService:  OtpService

   
  ) {}

async addVan(createVanDto: CreateVanDto, userId: string, userType: string) {
  // Step 1: Sirf driver allowed hai
  if (userType !== 'driver') {
    throw new UnauthorizedException('Only drivers can add vans');
  }

  // Step 2: Driver find karo
  const driver = await this.databaseService.repositories.driverModel.findById(userId);
  if (!driver) {
    throw new UnauthorizedException('Driver not found');
  }

  // Step 3: DTO se sab fields nikaalo
  const { 
    licenceImageFront, 
    licenceImageBack, 
    vehicleCardImageFront, 
    vehicleCardImageBack, 
    ...vanData 
  } = createVanDto;

  // Step 4: Driver document me direct update karo (sab fields ayengi)
  driver.licenceImageFront = licenceImageFront;
  driver.licenceImageBack = licenceImageBack;
  driver.vehicleCardImageFront = vehicleCardImageFront;
  driver.vehicleCardImageBack = vehicleCardImageBack;

  await driver.save();

  // Step 5: Van create karo
  const newVan = new this.databaseService.repositories.VanModel({
    ...vanData,
    driverId: driver._id,
  });

  const savedVan = await newVan.save();

  // Step 6: Response
  return {
    message: 'Van added and driver documents updated successfully',
    data: {
      van: savedVan,
      driver,
    },
  };
}

async getVans(userId: string, userType: string) {
  // Step 1: Sirf drivers allowed
  if (userType !== 'driver') {
    throw new UnauthorizedException('Only drivers can view their vans');
  }

  // Step 2: Driver validate karo
  const driver = await this.databaseService.repositories.driverModel.findById(userId);
  if (!driver) {
    throw new UnauthorizedException('Driver not found');
  }

  // Step 3: Vans fetch karo by driverId
  const vans = await this.databaseService.repositories.VanModel.find({ driverId: driver._id });

  // Step 4: Wrap in "data"
  return {
    message: 'Vans fetched successfully',
    data: vans,
  };
}




async addVanByAdmin(dto: CreateVanByAdminDto, adminId: string) {
    const adminObjectId = new Types.ObjectId(adminId);

  
    const school = await this.databaseService.repositories.SchoolModel.findOne({ admin: adminObjectId });
    if (!school) {
      throw new UnauthorizedException('School not found');
    }

 
    const newVan = new this.databaseService.repositories.VanModel({
      
      schoolId: school._id,
      vehicleType: dto.vehicleType,
      carNumber: dto.carNumber,
      condition: dto.condition,
      venCapacity: dto.venCapacity,
      deviceId: dto.deviceId,
      assignRoute: dto.assignRoute,
      venImage: dto.venImage
    });

    const savedVan = await newVan.save();

    // Step 5: Return response
    return {
      message: 'Van added successfully',
      data: savedVan,
    };
  }

   async editVanByAdmin(dto: EditVanByAdminDto, adminId: string) {
    const adminObjectId = new Types.ObjectId(adminId);
    const vanObjectId = new Types.ObjectId(dto.vanId);
     const driverObjectId = new Types.ObjectId(dto.driverId);


  
    const school = await this.databaseService.repositories.SchoolModel.findOne({ admin: adminObjectId });
    if (!school) {
      throw new UnauthorizedException('School not found');
    }

    const schoolId = school._id.toString()

    
    const van = await this.databaseService.repositories.VanModel.findById({ _id: vanObjectId});
    if (!van) {
      throw new BadRequestException('Van not found');
    }

    // Step 3: Find driver by driverId
    // const driver = await this.databaseService.repositories.driverModel.findById({_id: driverObjectId } );
    // if (!driver) {
    //   throw new BadRequestException('Driver not found');
    // }

    const updatedVan = await this.databaseService.repositories.VanModel.findOneAndUpdate(
  { _id: vanObjectId },
  {
    $set: {
      vehicleType: dto.vehicleType,
      carNumber: dto.carNumber,
      condition: dto.condition,
      venCapacity: dto.venCapacity,
      deviceId: dto.deviceId,
      assignRoute: dto.assignRoute,
      venImage: dto.venImage
    },
  },
  { new: true }, // updated document return kare
);

// const updatedDriver = await this.databaseService.repositories.driverModel.findOneAndUpdate(
//   { _id: driverObjectId },
//   {
//     $set: {
//       fullname: dto.fullname,
//       NIC: dto.NIC,
//       phoneNo: dto.phoneNo,
//       email: dto.email,
//       image: dto.image
//     },
//   },
//   { new: true },
// );

return {
  message: 'Van updated successfully',
  data: {
    van: updatedVan,
    // driver: updatedDriver,
  },
};
}

async getVansByAdmin(
  AdminId: string,
  page = 1,
  limit = 10,
  search?: string,
) {
  const adminObjectId = new Types.ObjectId(AdminId);

  // 1. Find school
  const school =
    await this.databaseService.repositories.SchoolModel.findOne({
      admin: adminObjectId,
    });

  if (!school) {
    throw new UnauthorizedException('School not found');
  }

  const skip = (page - 1) * limit;

  // 2. Aggregation pipeline
  const pipeline = [
    {
      $match: {
        schoolId: school._id.toString(),
        ...(search
          ? { carNumber: { $regex: search, $options: 'i' } }
          : {}),
      },
    },

    // 🔹 Lookup Driver
    {
      $lookup: {
        from: 'drivers',
        localField: 'driverId',
        foreignField: '_id',
        as: 'driver',
      },
    },
    {
      $unwind: {
        path: '$driver',
        preserveNullAndEmptyArrays: true,
      },
    },

    // 🔹 Lookup Route (vanId string === van._id string)
    {
      $lookup: {
        from: 'routes',
        let: { vanIdStr: { $toString: '$_id' } },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$vanId', '$$vanIdStr'],
              },
            },
          },
        ],
        as: 'route',
      },
    },
    {
      $unwind: {
        path: '$route',
        preserveNullAndEmptyArrays: true,
      },
    },

    // 🔹 Final Response Shape
    {
      $project: {
        van: {
          id: { $toString: '$_id' },
          condition: { $ifNull: ['$condition', ''] },
          deviceId: { $ifNull: ['$deviceId', ''] },
          assignRoute: { $ifNull: ['$assignRoute', ''] },
          vehicleType: { $ifNull: ['$vehicleType', ''] },
          carNumber: { $ifNull: ['$carNumber', ''] },
          status: { $ifNull: ['$status', ''] },
        },

        driver: {
          id: {
            $cond: [
              { $ifNull: ['$driver._id', false] },
              { $toString: '$driver._id' },
              null,
            ],
          },
          fullname: { $ifNull: ['$driver.fullname', ''] },
          image: { $ifNull: ['$driver.image', ''] },
          phoneNo: { $ifNull: ['$driver.phoneNo', ''] },
        },

        route: {
          id: {
            $cond: [
              { $ifNull: ['$route._id', false] },
              { $toString: '$route._id' },
              null,
            ],
          },
          title: { $ifNull: ['$route.title', ''] },
          tripType: { $ifNull: ['$route.tripType', ''] },
          
        },

        _id: 0,
      },
    },

    { $skip: skip },
    { $limit: limit },
  ];

  const vans =
    await this.databaseService.repositories.VanModel.aggregate(pipeline);

  const total =
    await this.databaseService.repositories.VanModel.countDocuments({
      schoolId: school._id.toString(),
      ...(search
        ? { carNumber: { $regex: search, $options: 'i' } }
        : {}),
    });

  return {
    message: 'Vans fetched successfully',
    data: vans,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}



async getVanById(vanId: string) {
  // 1. Van find karo
  const van = await this.databaseService.repositories.VanModel.findById(vanId);

  if (!van) {
    throw new BadRequestException("van not found");
  }

  // 2. Driver find karo
  let driver = null;
  if (van.driverId) {
    driver = await this.databaseService.repositories.driverModel.findById(van.driverId);
  }

  // 3. Response return karo
  return {
    message: "Van fetched successfully",
    data: {
      id: van._id,
      vehicleType: van.vehicleType || "",
      condition: van.condition || "",
      deviceId: van.deviceId || "",
      numberPlate: van.carNumber || "",
      capacity: van.venCapacity || 0,
      route: van.assignRoute || "",
      status: van.status || "inactive",

      // ✅ driver info direct fields ke saath
      driverName: driver?.fullname || "",
      driverPhone: driver?.phoneNo || "",
      driverCnic: driver?.NIC || "",
      driverPicture: driver?.image || "",
      driverId: driver?._id || null,
    },
  };
}

async updateVanStatusByAdmin(
  vanIds: string[],
  adminId: string,
  status: string,
) {
  const adminObjectId = new Types.ObjectId(adminId);

 
  const school = await this.databaseService.repositories.SchoolModel.findOne({
    admin: adminObjectId,
  });

  if (!school) {
    throw new UnauthorizedException('School not found');
  }

  const schoolIdString = school._id.toString();

 
  if (status !== 'active' && status !== 'inActive') {
    throw new BadRequestException('Invalid status value');
  }

  if (!vanIds || vanIds.length === 0) {
    throw new BadRequestException('vanIds array is required');
  }

  const vanObjectIds = vanIds.map(id => new Types.ObjectId(id));

 
  const result =
    await this.databaseService.repositories.VanModel.updateMany(
      {
        _id: { $in: vanObjectIds },
        schoolId: schoolIdString,
      },
      {
        $set: {
          status: status,
        },
      },
    );

  // 4. Fetch updated vans
  const updatedVans =
    await this.databaseService.repositories.VanModel.find(
      {
        _id: { $in: vanObjectIds },
        schoolId: schoolIdString,
      },
      {
        carNumber: 1,
        status: 1,
      },
    );

 
  return {
    message: 'Vans status updated successfully',
    modifiedCount: result.modifiedCount,
    vans: updatedVans,
  };
}

async removeDriverFromVan(vanId: string , adminId: string) {
  const adminObjectId = new Types.ObjectId(adminId);

 
  const school = await this.databaseService.repositories.SchoolModel.findOne({
    admin: adminObjectId,
  });

  if (!school) {
    throw new UnauthorizedException('School not found');
  }


  const vanObjectId = new Types.ObjectId(vanId);

  // 1. Update van → driverId null
  const result = await this.databaseService.repositories.VanModel.updateOne(
    { _id: vanObjectId },
    { $set: { driverId: null } }
  );

  // 2. Fetch updated van
  const updatedVan = await this.databaseService.repositories.VanModel.findOne(
    { _id: vanObjectId }
  );

  // 3. Response
  return {
    message: 'Driver removed from van successfully',
    modifiedCount: result.modifiedCount,
    van: updatedVan,
  };
}


async updateProfile(
  userId: string,
  userType: 'driver' | 'parent',
  editDto: EditDriverDto,   // 👈 same DTO dono ke liye
) {
  let updatedDoc;

  if (userType === 'driver') {
    updatedDoc = await this.databaseService.repositories.driverModel.findByIdAndUpdate(
      userId,
      { $set: editDto },
      { new: true },
    );
  } else if (userType === 'parent') {
    updatedDoc = await this.databaseService.repositories.parentModel.findByIdAndUpdate(
      userId,
      { $set: editDto },
      { new: true },
    );
  } else {
    throw new BadRequestException('Invalid user type');
  }

  if (!updatedDoc) {
    throw new BadRequestException(`${userType} not found`);
  }

  return {
    message: `${userType} updated successfully`,
    data: updatedDoc,
  };
}


async updateVan(driverId: string, vanId: string, createVanDto: CreateVanDto) {
    // 🔹 Step 1: Driver check
    const driver = await this.databaseService.repositories.driverModel.findById(driverId);
    if (!driver) {
      throw new BadRequestException('Driver not found');
    }

    // 🔹 Step 2: Van check
    const van = await this.databaseService.repositories.VanModel.findById(vanId);
    if (!van) {
      throw new BadRequestException('Van not found');
    }

    // 🔹 Step 3: Update van with DTO
    const updatedVan = await this.databaseService.repositories.VanModel.findByIdAndUpdate(
      vanId,
     { $set: { ...createVanDto } }, // 👈 spread use karo
      { new: true },
    );

    return {
      message: 'Van updated successfully',
      data: updatedVan,
    };
  }

async getDriverKids(
  userId: string,
  tripId: string,
  page: number,
  limit: number,
) {

  console.log(userId)
  
  const driver = await this.databaseService.repositories.driverModel.findById(userId);
  if (!driver) throw new UnauthorizedException('Driver not found');

 
  const van = await this.databaseService.repositories.VanModel.findOne({ driverId: driver._id });
  if (!van) throw new BadRequestException('Van not found for this driver');

  const schoolId = van.schoolId;

  if (!schoolId) {
    throw new BadRequestException('School not found for this van'); 
  }

 
  const tripObjectId = new Types.ObjectId(tripId);
  const trip = await this.databaseService.repositories.TripModel.findById(tripObjectId);
  if (!trip) {
    throw new BadRequestException('Trip not found ');
  }

  // 🔹 Pagination calculate
  const skip = (page - 1) * limit;

  // 🔹 Kids fetch with parent lookup
  const kids = await this.databaseService.repositories.KidModel.aggregate([
    {
      $match: { VanId: van._id.toString(), schoolId: schoolId.toString(), status: 'active' },

    },
    {
      $lookup: {
        from: "parents",         
        localField: "parentId",  
        foreignField: "_id",     
        as: "parent"
      }
    },
    { $unwind: { path: "$parent", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        fullname: 1,
        image: 1,
        "parent.address": 1,
        "parent.phoneNo": 1,
        "parent.alternatePhoneNo": 1
      }
    },
    { $skip: skip },
    { $limit: limit }
  ]);

  // 🔹 Total count for pagination
  const totalKidsInVan = await this.databaseService.repositories.KidModel.countDocuments({
    VanId: van._id.toString(),
  });

  // 🔹 Trip ke kids ids
  const tripKidIds = new Set(trip.kids.map((k: any) => k.kidId.toString()));

  // 🔹 Response kids banao
  const responseKids = kids.map(kid => ({
    _id: kid._id,
    name: kid.fullname,
    image: kid.image,
    picked: tripKidIds.has(kid._id.toString()),
    parent: kid.parent ? {
      address: kid.parent.address,
      phone: kid.parent.phoneNo,
      alternatePhone: kid.parent.alternatePhoneNo,
    } : null,
  }));

  // 🔹 Picked count (sirf current page ke kids pe)
  const pickedCount = responseKids.filter(k => k.picked).length;

  return {
    message: 'Van kids with parent info and pickup status fetched successfully',
    data: {
      vanId: van._id,
      totalKids: totalKidsInVan,
      pickedCount,
      page,
      limit,
      totalPages: Math.ceil(totalKidsInVan / limit),
      kids: responseKids,
    },
  };
}

async uploadDocument(body: any, driverId: string) {
  if (!driverId) {
    throw new UnauthorizedException('Invalid driver token');
  }

  const {
    title,
    licenceImageFront,
    licenceImageBack,
    vehicleCardImageFront,
    vehicleCardImageBack,
    expiryDateLicense,
    expiryDateVehicleCard
  } = body;

  // Step 1: Find driver
  const driver = await this.databaseService.repositories.driverModel.findById(
    new Types.ObjectId(driverId)
  );

  if (!driver) {
    throw new BadRequestException('Driver not found');
  }

  // Step 2: Update only fields that are sent in request
  if (licenceImageFront) driver.licenceImageFront = licenceImageFront;
  if (licenceImageBack) driver.licenceImageBack = licenceImageBack;
  if (vehicleCardImageFront) driver.vehicleCardImageFront = vehicleCardImageFront;
  if (vehicleCardImageBack) driver.vehicleCardImageBack = vehicleCardImageBack;
  if (expiryDateLicense) driver.expiryDateLicense = expiryDateLicense;
  if (expiryDateVehicleCard) driver.expiryDateVehicleCard = expiryDateVehicleCard;

  // Step 3: Save changes
  await driver.save();

  return {
    message: 'Driver documents uploaded successfully',
    data: driver,
  };
}




async getDriverDocuments(driverId: string) {
  if (!driverId) {
    throw new UnauthorizedException('Invalid driver token');
  }

  // Step 1: Driver find karo
  const driver = await this.databaseService.repositories.driverModel.findById(
    new Types.ObjectId(driverId),
    'licenceImageFront licenceImageBack vehicleCardImageFront vehicleCardImageBack' // sirf ye 4 fields lo
  );

  if (!driver) {
    throw new BadRequestException('Driver not found');
  }

  // Step 2: Response return karo
  return {
    message: 'Driver documents fetched successfully',
    data: driver,
  };
}
// async getVehicleType(driverId: string) {
//   if (!driverId) {
//     throw new UnauthorizedException('Invalid driver token');
//   }

//   // Step 1: Van find karo based on driverId
//   const van = await this.databaseService.repositories.VanModel.findOne(
//     { driverId: new Types.ObjectId(driverId) },
//   );

//   if (!van) {
//     throw new BadRequestException('Van not found for this driver');
//   }

//   // Step 2: Response return karo
//   return {
//     message: 'Vehicle type fetched successfully',
//     data: {
//       vehicleType: van.vehicleType,
//     },
//   };
// }

async deleteVan(driverId: string) {
  if (!driverId) {
    throw new UnauthorizedException('Invalid driver token');
  }

  // Step 1: Van find karo based on driverId
  const van = await this.databaseService.repositories.VanModel.findOne({
    driverId: new Types.ObjectId(driverId),
  });

  if (!van) {
    throw new BadRequestException('Van not found for this driver');
  }

  // Step 2: driverId ko null kar do
  van.driverId = null;
  van.status = 'inactive'; 

  // Step 3: Save updated document
  await van.save();

  return {
    message: 'Van unlinked from driver successfully',
  };
}

async deleteVanByAdmin(adminId: string, vanId: string) {

  const adminObjectId = new Types.ObjectId(adminId);
  const vanObjectId = new Types.ObjectId(vanId);
  const school = await this.databaseService.repositories.SchoolModel.findOne({
    admin: adminObjectId,
  });

  if (!school) {
    throw new UnauthorizedException('School not found');
  }

  const schoolIdString = school._id.toString();
  console.log(schoolIdString, vanObjectId)
  
  const van = await this.databaseService.repositories.VanModel.findOne({
    _id: vanObjectId,
    schoolId: schoolIdString,
  });

  if (!van) {
    throw new BadRequestException('Van not found');
  }

  // Step 2: driverId ko null kar do
  van.schoolId = null;
  van.status = 'inActive'; 

  // Step 3: Save updated document
  await van.save();
  

  return {
    message: 'Van deleted from School successfully',
  };
}

async getVansBySchool(schoolId: string) {
  // find all vans where schoolId matches
  const vans = await this.databaseService.repositories.VanModel.find({ schoolId });

  // if no vans found
  if (!vans || vans.length === 0) {
    throw new NotFoundException('No vans found for this school');
  }

  return {
    message: 'Vans fetched successfully',
    count: vans.length,
    data: vans,
  };
}








}








  

  

  