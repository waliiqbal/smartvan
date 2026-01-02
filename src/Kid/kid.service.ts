/* eslint-disable prettier/prettier */
import { BadGatewayException, Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from "src/database/databaseservice";
import { CreateKidDto } from './dto/CreateKid.dto';
import { Types } from 'mongoose';
import mongoose from 'mongoose';
import { FirebaseAdminService } from 'src/notification/firebase-admin.service';
import { Kid } from './kid.schema';





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
    const driver = await this.databaseService.repositories.driverModel.findById(userId);
  if (!driver) throw new UnauthorizedException('Driver not found');

  // 🔹 Driver ki van
  const van = await this.databaseService.repositories.VanModel.findOne({ driverId: driver._id });
  if (!van) throw new BadRequestException('Van not found for this driver');

  // Step 3: Parent ID se bachay fetch karo
  const kids = await this.databaseService.repositories.KidModel.find({ VanId: van._id.toString() });

      // Step 4: Response wrap in data
      return {
        message: 'Kids fetched successfully',
        data: kids,
      };
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
      data: kid

      
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

async assignVanToDriver(driverId: string, vanId: string, adminId: string) {
  const adminObjectId = new Types.ObjectId(adminId);
  const driverObjectId = new Types.ObjectId(driverId);
  

  // Step 1: Find school by adminId
  const school = await this.databaseService.repositories.SchoolModel.findOne({ admin: adminObjectId });
  console.log(school._id)

  if (!school) {
    throw new UnauthorizedException('School not found');
  }

  const Driver = await this.databaseService.repositories.driverModel.findOne({ _id: driverObjectId });

  const schoolIdString = school._id.toString();
  console.log(schoolIdString)



  // Step 2: Find kid by id
  const van = await this.databaseService.repositories.VanModel.findOne({ _id: vanId, schoolId: schoolIdString });
 

  if (!van) {
    throw new BadGatewayException('van not found in this school');
  }

  // Step 3: Check if van already assigned
  if (van.driverId) {
    return {
      message: 'Van already assigned to this Driver',
      data: van
    };
  }

  // Step 4: Assign new van
  van.driverId = driverObjectId
  const updatedVan = await van.save();

  return {
    message: 'Van assigned successfully',
    data: updatedVan 
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

async updateKid(parentId: string, kidId: string, createKidDto: CreateKidDto) {
    // 🔹 Step 1: Driver check
    const parent = await this.databaseService.repositories.parentModel.findById(parentId);
    if (!parent) {
      throw new BadRequestException('parents not found');
    }

    // 🔹 Step 2: Van check
    const kid  = await this.databaseService.repositories.KidModel.findById(kidId);
    if (!kid) {
      throw new BadRequestException('kid not found');
    }

    // 🔹 Step 3: Update van with DTO
    const updatedKid = await this.databaseService.repositories.KidModel.findByIdAndUpdate(
      kidId,
     { $set: { ...createKidDto } }, // 👈 spread use karo
      { new: true },
    );

    return {
      message: 'kid updated successfully',
      data: updatedKid,
    };
  }

  async getParentActiveTrips(parentId: string) {
    // Step 1: Parent ke kids fetch (Name + VanId)
    const kids = await this.databaseService.repositories.KidModel.find(
      { parentId: new Types.ObjectId(parentId) },
      { VanId: 1, fullname: 1, image: 1 }
    );
  
    if (!kids || kids.length === 0) return [];
  
    // Step 2: Unique VanIDs extract
    const vanIds = kids.map(k => k.VanId);
    const uniqueVanIds = [...new Set(vanIds)];
  
    // Step 3: Kids ko van-wise group karo
    const kidsByVan = kids.reduce((acc, kid) => {
      if (!acc[kid.VanId]) acc[kid.VanId] = [];
      acc[kid.VanId].push({
        id: kid._id.toString(),
        name: kid.fullname,
        image: kid?.image || "",
      });
      return acc;
    }, {});
  
    // Date filter for "today"
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
  
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
  
    // Step 4: Trips fetch
    const trips = await this.databaseService.repositories.TripModel.aggregate([
      {
        $match: {
          vanId: { $in: uniqueVanIds },
          status: { $ne: "end" },
          "tripStart.startTime": {
            $gte: todayStart,
            $lte: todayEnd
          }
        }
      },
      {
        $lookup: {
          from: "vans",
          let: { tripVanId: { $toObjectId: "$vanId" } },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$tripVanId"] } } },
            {
              $lookup: {
                from: "drivers",
                localField: "driverId",
                foreignField: "_id",
                as: "driver"
              }
            },
            { $unwind: { path: "$driver", preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
                from: "schools",
                let: { schoolIdStr: "$schoolId" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ["$_id", { $toObjectId: "$$schoolIdStr" }]
                      }
                    }
                  },
                  { $project: { contactNumber: 1 } }
                ],
                as: "school"
              }
            },
            { $unwind: { path: "$school", preserveNullAndEmptyArrays: true } }
          ],
          as: "van"
        }
      },
      { $unwind: { path: "$van", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          tripId: "$_id",
          vanId: "$vanId",
          kids: 1, // <<----- IMPORTANT: return kids from DB
          startTime: "$tripStart.startTime",
          status: 1,
          type: 1,
          locations: 1,
          carNumber: "$van.carNumber",
          assignRoute: "$van.assignRoute",
          driverFullname: "$van.driver.fullname",
          driverImage: "$van.driver.image",
          driverPhoneNo: "$van.driver.phoneNo",
          schoolContact: "$van.school.contactNumber",
          _id: 0
        }
      }
    ]);
  
    // Step 5: Merge kids status
    const tripsWithKids = trips.map(t => {
      const vanKids = kidsByVan[t.vanId] || [];
  
      const kidsWithStatus = vanKids.map(k => {
        const tripKid = t.kids?.find(x => x.kidId === k.id);
  
        return {
          ...k,
          pickupStatus: tripKid? true : false ,
          pickupTime: tripKid?.time || null,
          lat: tripKid?.lat || null,
          long: tripKid?.long || null
        };
      });
  
      return {
        ...t,
        kids: kidsWithStatus
      };
    });
  
    return { data: tripsWithKids };
  }
  
  

async getParentDriversWithSchool(parentId: string) {
  const Kid = this.databaseService.repositories.KidModel;
  const Van = this.databaseService.repositories.VanModel;
  const User = this.databaseService.repositories.driverModel;
  const School = this.databaseService.repositories.SchoolModel;

  // 1) Parent ke kids fetch karo (required fields + VanId + schoolId)
  const kids = await Kid.find(
    { parentId: new Types.ObjectId(parentId) },
    {
      _id: 1,
      fullname: 1,
      gender: 1,
      grade: 1,
      image: 1,
      status: 1,
      verifiedBySchool: 1,
      VanId: 1,
      schoolId: 1,
    }
  ).lean();

  if (!kids || kids.length === 0) {
    return { data: [] };
  }

  // 2) Unique VanIds -> ObjectId[]
  const vanIds = Array.from(new Set(kids.map(k => k.VanId).filter(Boolean)));
  const vanObjectIds = vanIds
    .filter(id => Types.ObjectId.isValid(id))
    .map(id => new Types.ObjectId(id));

  // 3) Vans fetch karo
  let vans: any[] = [];
  if (vanObjectIds.length > 0) {
    vans = await Van.find(
      { _id: { $in: vanObjectIds } },
      {
        _id: 1,
        carNumber: 1,
        venCapacity: 1,
        condition: 1,
        vehicleType: 1,
        status: 1,
        venImage: 1,
        assignRoute: 1,
        deviceId: 1,
        driverId: 1,
      }
    ).lean();
  }

  // 4) Drivers fetch karo
  const driverIds = Array.from(
    new Set(vans.map(v => v.driverId?.toString()).filter(Boolean))
  );
  let drivers: any[] = [];
  if (driverIds.length > 0) {
    drivers = await User.find(
      { _id: { $in: driverIds.map(id => new Types.ObjectId(id)) } },
      {
        _id: 1,
        fullname: 1,
        phoneNo: 1,
        image: 1,
        userType: 1,
        isVerified: 1,
        lat: 1,
        long: 1,
        address: 1,
        email: 1,
      }
    ).lean();
  }
  const driverMap = new Map(drivers.map(d => [d._id.toString(), d]));

  // 5) Schools fetch karo
  const schoolIds = Array.from(
    new Set(kids.map(k => k.schoolId).filter(Boolean))
  );
  let schoolMap = new Map<string, string>();
  if (schoolIds.length > 0) {
    const schools = await School.find(
      { _id: { $in: schoolIds.map(id => new Types.ObjectId(id)) } },
      { _id: 1, schoolName: 1 }
    ).lean();
    schoolMap = new Map(schools.map(s => [s._id.toString(), s.schoolName]));
  }

  // 6) Kids ko VanId ke hisaab se group karo
  const kidsByVan = new Map<string, any[]>();
  for (const k of kids) {
    const vId = k.VanId ? String(k.VanId) : '';
    const kidLite = {
      id: k._id,
      fullname: k.fullname ?? null,
      gender: k.gender ?? null,
      grade: k.grade ?? null,
      image: k.image ?? null,
      status: k.status ?? null,
      verifiedBySchool: !!k.verifiedBySchool,
      schoolId: k.schoolId ?? null,
      schoolName: k.schoolId ? schoolMap.get(k.schoolId) ?? null : null,
    };
    if (!vId || !Types.ObjectId.isValid(vId)) continue;
    if (!kidsByVan.has(vId)) kidsByVan.set(vId, []);
    kidsByVan.get(vId)!.push(kidLite);
  }

  // 7) Result: har van + driver + uske kids
  const result = vans.map(v => {
    const vId = v._id.toString();
    const kidsOfThisVan = kidsByVan.get(vId) ?? [];
    const driver = v.driverId ? driverMap.get(v.driverId.toString()) : null;

    return {
      van: {
        id: v._id,
        carNumber: v.carNumber ?? null,
        capacity: v.venCapacity ?? null,
        condition: v.condition ?? null,
        vehicleType: v.vehicleType ?? null,
        status: v.status ?? null,
        image: v.venImage ?? null,
        assignRoute: v.assignRoute ?? null,
        deviceId: v.deviceId ?? null,
      },
      driver,
      kids: kidsOfThisVan,
    };
  });

  // 8) Unassigned kids (VanId missing/invalid/not found)
  const assignedVanIds = new Set(vans.map(v => v._id.toString()));
  const unassignedKids = kids
    .filter(
      k =>
        !k.VanId ||
        !Types.ObjectId.isValid(String(k.VanId)) ||
        !assignedVanIds.has(String(k.VanId))
    )
    .map(k => ({
      id: k._id,
      fullname: k.fullname ?? null,
      gender: k.gender ?? null,
      grade: k.grade ?? null,
      image: k.image ?? null,
      status: k.status ?? null,
      verifiedBySchool: !!k.verifiedBySchool,
      vanId: k.VanId ?? null,
      schoolId: k.schoolId ?? null,
      schoolName: k.schoolId ? schoolMap.get(k.schoolId) ?? null : null,
    }));

  if (unassignedKids.length > 0) {
    result.push({
      van: null,
      driver: null,
      kids: unassignedKids,
    });
  }

  return { data: result };
}

async getTripHistoryByParent(parentId: string,
  date?: string,
  page: number = 1,
  limit: number = 10,
) {
  // Step 1: Parent ke kids fetch karo (sirf vanIds)
  const kids = await this.databaseService.repositories.KidModel.find(
    { parentId: new Types.ObjectId(parentId) },
    { VanId: 1 }
  );

  if (!kids || kids.length === 0) return [];

  const vanIds = kids.map(k => k.VanId);
  const uniqueVanIds = [...new Set(vanIds)];

  // Step 2: Match condition banao
  const matchCondition: any = {
    vanId: { $in: uniqueVanIds },
    status: "end"
  };

  if (date) {
    const inputDate = new Date(date);

    const startOfDay = new Date(inputDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(inputDate.setHours(23, 59, 59, 999));

    matchCondition["updatedAt"] = {
      $gte: startOfDay,
      $lte: endOfDay,
    };
  }

  // Step 3: Total count for pagination
  const total = await this.databaseService.repositories.TripModel.countDocuments(
    matchCondition
  );

  // Step 4: Trips with pagination
  const trips = await this.databaseService.repositories.TripModel.find(
    matchCondition,
    { "tripStart.startTime": 1, "tripEnd.endTime": 1, status: 1, type: 1 } // 👈 sirf required fields
  )
    .sort({ updatedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

return {
  data: {
    total,        // total documents matching condition
    page,         // current page
    limit,        // per page
    totalPages: Math.ceil(total / limit),
    trips,        // paginated trips
  }
};

}

async getTripHistoryByDriver(
  driverId: string,
  page: number = 1,
  limit: number = 10,
  recent: boolean = false,
) {
  // ✅ Step 1: Driver ki van nikaalo
  const van = await this.databaseService.repositories.VanModel.findOne(
    { driverId: new Types.ObjectId(driverId) },
    { VanId: 1 },
  );

  if (!van) {
    return {
      data: recent ? [] : {
        total: 0,
        page,
        limit,
        totalPages: 0,
        trips: [],
      },
    };
  }

  const vanId = van?._id;

  // ✅ Step 2: Base match condition
  const matchCondition: any = {
    vanId: vanId,
    status: 'end',
  };

  // ✅ Step 3: Aaj ki date range
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  // ================= RECENT =================
  if (recent) {
    matchCondition.updatedAt = {
      $gte: startOfDay,
      $lte: endOfDay,
    };

    const trips = await this.databaseService.repositories.TripModel.find(
      matchCondition,
      {
        vanId: 1,
        type: 1,
        status: 1,
        tripStart: 1,
        tripEnd: 1,
        updatedAt: 1,
        kids: 1, // passenger count ke liye
      },
    ).sort({ updatedAt: -1 });

    return {
      data: trips,
    };
  }

  // ================= PAST =================
  matchCondition.updatedAt = {
    $lt: startOfDay,
  };

  const total =
    await this.databaseService.repositories.TripModel.countDocuments(
      matchCondition,
    );

  const trips = await this.databaseService.repositories.TripModel.find(
    matchCondition,
    {
      vanId: 1,
      type: 1,
      status: 1,
      tripStart: 1,
      tripEnd: 1,
      updatedAt: 1,
      kids: 1,
    },
  )
    .sort({ updatedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return {
    data: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      trips,
    },
  };
}


async deleteKidByIdAndParent(parentId: string, kidId: string) {
  const Kid = this.databaseService.repositories.KidModel;

  // 1) Validate ObjectIds
  if (!Types.ObjectId.isValid(parentId) || !Types.ObjectId.isValid(kidId)) {
    return { message: 'Invalid parentId or kidId' };
  }

  // 2) Find and delete the kid
  const result = await Kid.deleteOne({
    _id: new Types.ObjectId(kidId),
    parentId: new Types.ObjectId(parentId),
  });

  // 3) Response
  if (result.deletedCount > 0) {
    return { message: 'Kid deleted successfully' };
  } else {
    return { message: 'Kid not found for this parent' };
  }
}


}