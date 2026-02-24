/* eslint-disable prettier/prettier */
import { BadGatewayException, Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from "src/database/databaseservice";
import { CreateKidDto } from './dto/CreateKid.dto';
import { Types } from 'mongoose';
import mongoose from 'mongoose';
import { FirebaseAdminService } from 'src/notification/firebase-admin.service';
import { Kid } from './kid.schema';
import { title } from 'process';





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


  if (userType !== 'parent') {

    const driver =
      await this.databaseService.repositories.driverModel.findById(userId);
    if (!driver) throw new UnauthorizedException('Driver not found');

    const van =
      await this.databaseService.repositories.VanModel.findOne({
        driverId: driver._id
      });
    if (!van) throw new BadRequestException('Van not found');

   
 if (van.status !== "active") {
    throw new BadRequestException('Van is not active');
  }
   

    const kids =
      await this.databaseService.repositories.KidModel.aggregate([

        { $match: { VanId: van._id.toString() }},


        {
          $lookup: {
            from: "vans",
            let: { vanObjId: { $toObjectId: "$VanId" }},
            pipeline: [
              { $match: { $expr: { $eq: ["$_id","$$vanObjId"] }}},
              { $project:{ carNumber:1, vanNumber:1 }}
            ],
            as: "van"
          }
        },
        { $unwind:{ path:"$van", preserveNullAndEmptyArrays:true }},

        // DRIVER LOOKUP
        {
          $lookup:{
            from:"drivers",
            localField:"van.driverId",
            foreignField:"_id",
            pipeline:[
              { $project:{ fullname:1, phoneNo:1 }}
            ],
            as:"driver"
          }
        },
        { $unwind:{ path:"$driver", preserveNullAndEmptyArrays:true }},

          {
          $lookup: {
            from: "schools",
            let: { schoolObjId: { $toObjectId: "$schoolId" } },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$schoolObjId"] }
                }
              },
              {
                $project: {
                  schoolName: 1,
                  schoolEmail: 1
                }
              }
            ],
            as: "school"
          }
        },
        {
          $unwind: {
            path: "$school",
            preserveNullAndEmptyArrays: true
          }
        }

      ]);

    return {
      message:'Kids fetched successfully',
      data:kids
    };
  }


  const parent =
    await this.databaseService.repositories.parentModel.findById(userId);
  if (!parent) throw new UnauthorizedException('Parent not found');

  const kids =
    await this.databaseService.repositories.KidModel.aggregate([

      { $match:{ parentId: parent._id }},


      {
        $lookup:{
          from:"vans",
          let:{ vanObjId:{ $toObjectId:"$VanId" }},
          pipeline:[
            { $match:{ $expr:{ $eq:["$_id","$$vanObjId"] }}},
            { $project:{ carNumber:1, vanNumber:1, driverId:1, status:1 }}
          ],
          as:"van"
        }
      },
      { $unwind:{ path:"$van", preserveNullAndEmptyArrays:true }},

      // DRIVER LOOKUP
      {
        $lookup:{
          from:"drivers",
          localField:"van.driverId",
          foreignField:"_id",
          pipeline:[
            { $project:{ fullname:1, phoneNo:1 }}
          ],
          as:"driver"
        }
      },
      { $unwind:{ path:"$driver", preserveNullAndEmptyArrays:true }},

        {
          $lookup: {
            from: "schools",
            let: { schoolObjId: { $toObjectId: "$schoolId" } },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$schoolObjId"] }
                }
              },
              {
                $project: {
                  schoolName: 1,
                  schoolEmail: 1
                }
              }
            ],
            as: "school"
          }
        },
        {
          $unwind: {
            path: "$school",
            preserveNullAndEmptyArrays: true
          }
        },

    ]);

  return {
    message:'Kids fetched successfully',
    data:kids
  };
}


async assignVanToStudents(
  kidIds: string[],
  vanId: string,
  adminId: string,
) {

  const adminObjectId = new Types.ObjectId(adminId);
    const school = await this.databaseService.repositories.SchoolModel.findOne({ admin: adminObjectId });
  if (!school) {
    throw new UnauthorizedException('School not found');
  } 

  const van = await this.databaseService.repositories.VanModel.findOne({ _id: vanId, schoolId: school._id.toString() });

  if (!van) {
    throw new BadGatewayException('Van not found in this school');
  }

    if (van.status !== "active") {
    throw new BadRequestException('Van is not active');
  }

  const kidObjectIds = kidIds.map(id => new Types.ObjectId(id));

  // 1️⃣ Van assign karo
  await this.databaseService.repositories.KidModel.updateMany(
    { _id: { $in: kidObjectIds } },
    { $set: { VanId: vanId } },
  );

  // 2️⃣ Kids fetch karo (sirf parentId aur fullname chahiye)
  const kids = await this.databaseService.repositories.KidModel.find(
    { _id: { $in: kidObjectIds } },
    { parentId: 1, fullname: 1 },
  );

  // 3️⃣ Unique parentIds nikal lo
  const uniqueParentIds = [
    ...new Set(
      kids
        .filter(k => k.parentId)
        .map(k => k.parentId.toString())
    ),
  ];

  // 4️⃣ Har parent ko notification bhej do
  for (const parentId of uniqueParentIds) {

    const parent = await this.databaseService.repositories.parentModel.findById(parentId);

    if (!parent) continue;

    const title = "Van Assigned";
    const message = "Your child has been assigned to the van.";

    // 🔔 Push notification
    if (parent.fcmToken) {
      await this.firebaseAdminService.sendToDevice(
        parent.fcmToken,
        {
          notification: {
            title,
            body: message,
          },
        }
      );
    }

    // 💾 DB me save
    await this.databaseService.repositories.notificationModel.create({
      type: "admin",
      parentId: parent._id,
      VanId: vanId,
      title,
      message,
      actionType: "VAN_ASSIGNED",
      status: "sent",
      date: new Date(),
    });
  }

  return {
    message: "Van assigned & parents notified successfully",
  };
}


async assignVanToDriver(
  driverId: string,
  vanId: string,
  adminId: string,
) {

  const adminObjectId = new Types.ObjectId(adminId);
  const driverObjectId = new Types.ObjectId(driverId);

  // 1️⃣ Check School
  const school = await this.databaseService.repositories.SchoolModel.findOne({
    admin: adminObjectId,
  });

  if (!school) {
    throw new UnauthorizedException('School not found');
  }

  const schoolIdString = school._id.toString();

  // 2️⃣ Find Driver
  const driver = await this.databaseService.repositories.driverModel.findOne({
    _id: driverObjectId,
    schoolId: schoolIdString,
  });

  if (!driver) {
    throw new BadRequestException('Driver not found in this school');
  }

  // 3️⃣ Find Van
  const van = await this.databaseService.repositories.VanModel.findOne({
    _id: vanId,
    schoolId: schoolIdString,
  });

  if (!van) {
    throw new BadGatewayException('Van not found in this school');
  }

  if (van.status !== "active") {
    throw new BadRequestException('Van is not active');
  }

  if (van.driverId) {
    return {
      message: 'Van already assigned',
      data: van,
    };
  }

  // 4️⃣ Assign Driver
  van.driverId = driverObjectId;
  const updatedVan = await van.save();

  // 5️⃣ Send Notification to Driver
  const title = "Van Assigned";
  const message = "You have been assigned a new van.";

  if (driver.fcmToken) {
    await this.firebaseAdminService.sendToDevice(
      driver.fcmToken,
      {
        notification: {
          title,
          body: message,
        },
        data: {
          vanId: van._id.toString(),
          status: "VAN_ASSIGNED",
          time: new Date().toISOString(),
        },
      },
    );
  }

  // 6️⃣ Save Notification in DB
  await this.databaseService.repositories.notificationModel.create({
    type: "admin",
    driverId: driver._id,
    VanId: van._id,
    title,
    message,
    actionType: "VAN_ASSIGNED",
    status: "sent",
    date: new Date(),
  });

  return {
    message: 'Van assigned successfully & driver notified',
    data: updatedVan,
  };
}

async verifyStudentsByAdmin(
  kidIds: string[],
  adminId: string,
  status: string,
) {

  const adminObjectId = new Types.ObjectId(adminId);

  // 1️⃣ Find School
  const school = await this.databaseService.repositories.SchoolModel.findOne({
    admin: adminObjectId,
  });

  if (!school) {
    throw new UnauthorizedException('School not found');
  }

  const schoolIdString = school._id.toString();

  // 2️⃣ Validate status
  if (status !== 'active' && status !== 'inActive') {
    throw new BadRequestException('Invalid status value');
  }

  const kidObjectIds = kidIds.map(id => new Types.ObjectId(id));

  // 3️⃣ Update Kids
  const result = await this.databaseService.repositories.KidModel.updateMany(
    {
      _id: { $in: kidObjectIds },
      schoolId: schoolIdString,
    },
    {
      $set: {
        verifiedBySchool: true,
        status: status,
      },
    },
  );

  // 4️⃣ Fetch Updated Kids (parentId chahiye notification ke liye)
  const kids = await this.databaseService.repositories.KidModel.find(
    {
      _id: { $in: kidObjectIds },
      schoolId: schoolIdString,
    },
    {
      parentId: 1,
      fullname: 1,
    },
  );

  // 5️⃣ Unique Parent IDs
  const uniqueParentIds = [
    ...new Set(
      kids
        .filter(k => k.parentId)
        .map(k => k.parentId.toString()),
    ),
  ];

  // 6️⃣ Send Notification to Each Parent
  for (const parentId of uniqueParentIds) {

    const parent = await this.databaseService.repositories.parentModel.findById(parentId);
    if (!parent) continue;

    const title = "Student Verification Update";
    const message =
      status === "active"
        ? "Your child has been approved by the school."
        : "Your child has been marked inactive by the school.";

    // 🔔 Push
    if (parent.fcmToken) {
      await this.firebaseAdminService.sendToDevice(
        parent.fcmToken,
        {
          notification: {
            title,
            body: message,
          },
        },
      );
    }

    // 💾 Save in DB
    await this.databaseService.repositories.notificationModel.create({
      type: "admin",
      parentId: parent._id,
      title,
      message,
      actionType: "STUDENT_VERIFIED",
      status: "sent",
      date: new Date(),
    });
  }

  return {
    message: 'Students updated successfully & parents notified',
    modifiedCount: result.modifiedCount,
  };
}

async removeVanFromKids(
  kidIds: string[],
 
) {

  const kidObjectIds = kidIds.map(id => new Types.ObjectId(id));

  


  const result =
    await this.databaseService.repositories.KidModel.updateMany(
      {
        _id: { $in: kidObjectIds },
      },
      {
        $set: {
          VanId: null,
        },
      },
    );


  const updatedKids =
    await this.databaseService.repositories.KidModel.find(
      {
        _id: { $in: kidObjectIds },
      },
    
    );


  return {
    message: 'Van removed from kids successfully',
    modifiedCount: result.modifiedCount,
    kids: updatedKids,
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

    // new changes
   const parentobjId = new Types.ObjectId(parentId);

     const parent = await this.databaseService.repositories.parentModel.findById(parentobjId);

      if (!parent) { 
        throw new BadRequestException('Parent not found');  
        }

        const schoolId = parent.schoolId;

        if (!schoolId) {  
          throw new BadRequestException('Parent is not associated with any school');
        }
   
    const kids = await this.databaseService.repositories.KidModel.find(
      
      { parentId: new Types.ObjectId(parentId), schoolId: schoolId, status: "active" },
      { VanId: 1, fullname: 1, image: 1 }
    );

    console.log (kids)

    // end new changes 
  
    if (!kids || kids.length === 0) {
  throw new NotFoundException('Kids not found');
}

  
    
    const vanIds = kids.map(k => k.VanId);
    const uniqueVanIds = [...new Set(vanIds)];
  
   
// const vanIds = kids
//   .map(k => k.VanId)
//   .filter(Boolean); // null / undefined hata do

//   if (vanIds.length === 0) {
//   return []; 
// }


// const activeVans = await this.databaseService.repositories.VanModel.find({
//   _id: { $in: vanIds },
//   status: 'active'
// }).select('_id');

// if (activeVans.length === 0) {
//   return []; 
// }

// // 3) active vans ki ids nikaal lo
// const activeVanIds = activeVans.map(v => v._id.toString());

// // 4) unique active van ids
// const uniqueVanIds = [...new Set(activeVanIds)];
   
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
          Vanstatus: "$van.status",
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


  const vanIds = Array.from(new Set(kids.map(k => k.VanId).filter(Boolean)));
  if (!vanIds || vanIds.length === 0) {
  return []; 
}

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

async getTripHistoryByParent(
  parentId: string,
  date?: string,
  page: number = 1,
  limit: number = 10,
) {
  // ==============================
  // Step 1: Parent ke kids
  // ==============================
  const parentKids = await this.databaseService.repositories.KidModel.find(
    { parentId: new Types.ObjectId(parentId) }
  );

  if (!parentKids.length) {
    return {
      data: {
        total: 0,
        page,
        limit,
        totalPages: 0,
        trips: [],
      },
    };
  }

  const parentKidIds = parentKids.map(k => k._id.toString());
  const vanIds = [...new Set(parentKids.map(k => k.VanId))];
  console.log("Parent Kid IDs:", parentKidIds);

  // ==============================
  // Step 2: Match condition
  // ==============================
  const matchCondition: any = {
    vanId: { $in: vanIds },
    status: "end",
  };

  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    matchCondition.updatedAt = {
      $gte: startOfDay,
      $lte: endOfDay,
    };
  }

  // ==============================
  // Step 3: Aggregation
  // ==============================
  const pipeline: any[] = [

    { $match: matchCondition },

    // ✅ VAN LOOKUP
    {
      $lookup: {
        from: "vans",
        let: { vanObjId: { $toObjectId: "$vanId" } },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$vanObjId"] } } }
        ],
        as: "van",
      },
    },
    { $unwind: { path: "$van", preserveNullAndEmptyArrays: true } },

    // ✅ DRIVER LOOKUP
    {
      $lookup: {
        from: "drivers",
        localField: "van.driverId",
        foreignField: "_id",
        as: "driver",
      },
    },
    { $unwind: { path: "$driver", preserveNullAndEmptyArrays: true } },

    // ✅ ROUTE LOOKUP
    {
      $lookup: {
        from: "routes",
        let: { routeObjId: { $toObjectId: "$routeId" } },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$routeObjId"] } } }
        ],
        as: "route",
      },
    },
    { $unwind: { path: "$route", preserveNullAndEmptyArrays: true } },

    // ======================
    // ✅ KIDS FIX START
    // ======================

    { $unwind: "$kids" },

    {
      $match: {
        "kids.kidId": { $in: parentKidIds },
      },
    },

    // 👉 Kids table se name lana
    {
      $lookup: {
        from: "kids",
        let: { kidObjId: { $toObjectId: "$kids.kidId" } },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$kidObjId"] } } },
          { $project: { fullname: 1, image: 1 } }
        ],
        as: "kidInfo",
      },
    },
    { $unwind: "$kidInfo" },

    // ======================
    // Group back
    // ======================
    {
      $group: {
        _id: "$_id",
        status: { $first: "$status" },
        type: { $first: "$type" },
        tripStart: { $first: "$tripStart" },
        tripEnd: { $first: "$tripEnd" },
        updatedAt: { $first: "$updatedAt" },

        van: { $first: "$van" },
        driver: { $first: "$driver" },
        route: { $first: "$route" },

        kids: {
          $push: {
            kidId: "$kids.kidId",
            name: "$kidInfo.fullname",
            image: "$kidInfo.image",
            time: "$kids.time",
            lat: "$kids.lat",
            long: "$kids.long",
            status: "$kids.status",
          },
        },
      },
    },

    { $sort: { updatedAt: -1 } },

    // ======================
    // Projection
    // ======================
    {
      $project: {
        _id: 1,
        status: 1,
        type: 1,
        tripStart: 1,
        tripEnd: 1,
        updatedAt: 1,

        van: {
          _id: "$van._id",
          vanNumber: "$van.vanNumber",
          carNumber: "$van.carNumber",
        },

        driver: {
          _id: "$driver._id",
          fullname: "$driver.fullname",
          phoneNo: "$driver.phoneNo",
        },

        route: {
          _id: "$route._id",
          title: "$route.title",
        },

        kids: 1,
      },
    },

    // Pagination
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
        ],
      },
    },
  ];


  const result = await this.databaseService.repositories.TripModel.aggregate(pipeline);

  const trips = result[0]?.data || [];
  const total = result[0]?.metadata[0]?.total || 0;

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





async getTripHistoryByDriver(
  driverId: string,
  page: number,
  limit: number,
  recent: boolean,
) {

  const van = await this.databaseService.repositories.VanModel.findOne(
    { driverId: new Types.ObjectId(driverId) },
    { _id: 1 },
  );

 
  if (!van) {
    return {
      data: recent
        ? []
        : {
            total: 0,
            page,
            limit,
            totalPages: 0,
            trips: [],
          },
    };
  }

 
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);


  const matchCondition: any = {
    vanId: van._id.toString(),
    status: 'end',
  };

  if (recent) {
    matchCondition.updatedAt = {
      $gte: startOfDay,
      $lte: endOfDay,
    };
  } else {
    matchCondition.updatedAt = { $lt: startOfDay };
  }


  const pipeline: any[] = [
    { $match: matchCondition },

   
    {
      $lookup: {
        from: 'routes',
        let: { routeId: { $toObjectId: '$routeId' } },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$routeId'] } } },
        ],
        as: 'route',
      },
    },
    { $unwind: { path: '$route', preserveNullAndEmptyArrays: true } },


    {
      $lookup: {
        from: 'schools',
        let: { schoolId: { $toObjectId: '$schoolId' } },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$schoolId'] } } },
        ],
        as: 'school',
      },
    },
    { $unwind: { path: '$school', preserveNullAndEmptyArrays: true } },

   
    {
      $lookup: {
        from: 'vans',
        let: { vanId: { $toObjectId: '$vanId' } },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$vanId'] } } },
        ],
        as: 'van',
      },
    },
    { $unwind: { path: '$van', preserveNullAndEmptyArrays: true } },

    { $sort: { updatedAt: -1 } },
  ];

  // ================= RECENT =================
  if (recent) {
    const trips = await this.databaseService.repositories.TripModel.aggregate(
      pipeline,
    );

    return { data: trips };
  }

  // ================= PAST (Pagination) =================
  const totalResult =
    await this.databaseService.repositories.TripModel.aggregate([
      ...pipeline,
      { $count: 'total' },
    ]);

  const total = totalResult[0]?.total || 0;

  const trips =
    await this.databaseService.repositories.TripModel.aggregate([
      ...pipeline,
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ]);

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

 
  if (!Types.ObjectId.isValid(parentId) || !Types.ObjectId.isValid(kidId)) {
    return { message: 'Invalid parentId or kidId' };
  }


  const result = await Kid.updateOne(
    { _id: new Types.ObjectId(kidId), parentId: new Types.ObjectId(parentId) },
    {
      $set: {
        parentId: null,
        schoolId: null,
        VanId: null,
        status: 'inActive',
      },
    }
  );

  
  if (result.modifiedCount > 0) {
    return { message: 'Kid marked as inActive and relations removed' };
  } else {
    return { message: 'Kid not found for this parent' };
  }
}

}