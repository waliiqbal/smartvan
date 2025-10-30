/* eslint-disable prettier/prettier */
import { BadRequestException, Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from "src/database/databaseservice";
import { OtpService } from 'src/user/schema/otp/otp.service';
import * as crypto from 'crypto';
import { AddStudentDto } from './dto/addStudent.dto';
import { Types } from 'mongoose';
import { EditStudentDto } from './dto/editStudent.dto';

import mongoose from 'mongoose';



@Injectable()
export class AdminService {
  
  constructor(
   
    private databaseService: DatabaseService,
    private readonly otpService: OtpService, 

    private readonly jwtService: JwtService
  ) {}
  
async createAdminAndSchool(body: any) {
  const { adminInfo, schoolInfo } = body;

  const existingAdmin = await this.databaseService.repositories.AdminModel.findOne({
    email: adminInfo.email,
  });

  if (existingAdmin) {
    throw new Error("Admin with this email already exists");
  }

  const randomPassword = crypto.randomBytes(6).toString('hex'); // 12 char ka password
  const hashedPassword = await bcrypt.hash(randomPassword, 10);

  // Admin create karo
  const admin = await this.databaseService.repositories.AdminModel.create({
    ...adminInfo,
    password: hashedPassword,
  });

  // School create karo
  const school = await this.databaseService.repositories.SchoolModel.create({
    ...schoolInfo,
    admin: admin._id,
  });

  // JWT token generate karo
  const token = this.jwtService.sign(
    {
      sub: admin._id,
      email: admin.email,
      role: admin.role,
    },
    { expiresIn: '30d' }
  );

  // Clean response (exclude password, createdAt, updatedAt)
  const cleanAdmin = await this.databaseService.repositories.AdminModel
    .findById(admin._id)
    .select('-password -createdAt -updatedAt -__v');

  const cleanSchool = await this.databaseService.repositories.SchoolModel
    .findById(school._id)
    .select('-createdAt -updatedAt -__v');

  return {
    message: 'Admin and school created successfully.',
    data: {
      token,
      admin: cleanAdmin,
      school: cleanSchool,
    },
  };
}


async editAdminAndSchool(body: any) {
  const { schoolId, adminInfo, schoolInfo } = body;

  // ✅ 1. School document fetch karo
  const school = await this.databaseService.repositories.SchoolModel.findById(schoolId);
  if (!school) {
    throw new NotFoundException('School not found');
  }

  // ✅ 2. Admin document fetch karo school.admin se
  const admin = await this.databaseService.repositories.AdminModel.findById(school.admin);
  if (!admin) {
    throw new NotFoundException('Admin linked to this school not found');
  }

  // ✅ 3. Admin update (only provided fields)
  if (adminInfo && Object.keys(adminInfo).length > 0) {
    await this.databaseService.repositories.AdminModel.updateOne(
      { _id: admin._id },
      { $set: adminInfo }
    );
  }

  // ✅ 4. School update (add or modify any field)
  if (schoolInfo && Object.keys(schoolInfo).length > 0) {
    await this.databaseService.repositories.SchoolModel.updateOne(
      { _id: schoolId },
      { $set: schoolInfo }
    );
  }

  // ✅ 5. Updated data fetch karke sirf safe fields return karo
  const updatedAdmin = await this.databaseService.repositories.AdminModel.findById(admin._id).select(
    '-password -otp -otpExpiresAt -__v -createdAt -updatedAt'
  );

  const updatedSchool = await this.databaseService.repositories.SchoolModel.findById(schoolId).select(
    '-__v -createdAt -updatedAt'
  );

  // ✅ 6. Clean response
  return {
    message: 'Admin and School updated successfully',
    data: {
      admin: updatedAdmin,
      school: updatedSchool,
    },
  };
}

async getSchoolById(schoolId: string) {
  // 1️⃣ Find school and populate admin (excluding sensitive fields)
  const school = await this.databaseService.repositories.SchoolModel
    .findById(schoolId)
    .populate({
      path: 'admin',
      select: '-password -createdAt -otp -expiresOtp -updatedAt -__v' // ❌ ye fields hide kar dega
    });

  // 2️⃣ Check if school exists
  if (!school) {
    throw new NotFoundException('School not found');
  }

  // 3️⃣ Return response
  return {
    message: 'School fetched successfully',
    data: school,
  };
}




async getAllSchoolsBySuperAdmin(page = 1, limit = 10, search?: string) {
  const skip = (page - 1) * limit;

  // ✅ Filter for search
  const filter: any = {};
  if (search) {
    filter.schoolName = { $regex: search, $options: 'i' };
  }

  // ✅ Total count
  const total = await this.databaseService.repositories.SchoolModel.countDocuments(filter);

  // ✅ Fetch schools with limit & skip
  const schools = await this.databaseService.repositories.SchoolModel.find(
    filter,
    {
      schoolName: 1,
      contactPerson: 1,
      allowedVans: 1,
      allowedRoutes: 1,
      contactNumber: 1,
      status: 1,
    }
  )
    .skip(skip)
    .limit(limit);

  // ✅ Har school ke kids count (parallel with Promise.all)
  const data = await Promise.all(
    schools.map(async (school) => {
      const kidsCount = await this.databaseService.repositories.KidModel.countDocuments({
        schoolId: school._id.toString(), // string compare
      });

      return {
        schoolId: school._id,
        schoolName: school.schoolName,
        contactPerson: school.contactPerson,
        vanLimit: school.allowedVans,
        routesLimit: school.allowedRoutes,
        contactNumber: school.contactNumber,
        status: school.status,
        totalKids: kidsCount,
      };
    })
  );

  // ✅ Response
  return {
    message: 'Schools fetched successfully',
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}


async resendOtpForResetPassword(email: string) {
  try {
    // 🔍 Admin model use karo
    const admin = await this.databaseService.repositories.AdminModel.findOne({ email });

    if (!admin) {
      throw new UnauthorizedException('Admin not found');
    }


    // 🔑 New OTP generate karo
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // ✍️ Save OTP
    admin.otp = newOtp;
    admin.otpExpiresAt = otpExpiresAt;
    await admin.save();

    // 📧 Send OTP email
    await this.otpService.sendOtp(admin.email, newOtp);

    return {
      message: 'OTP sent successfully to your email for password reset',
      data: {
        adminId: admin._id,
        otp: admin.otp, // ⚠️ sirf testing/debug ke liye response me bhejna
      },
    };
  } catch (error) {
    throw new UnauthorizedException(error.message || 'Resend OTP for password reset failed');
  }
}


async forgotPasswordService(email: string) {
  // 1️⃣ User check karo
  const admin = await this.databaseService.repositories.AdminModel.findOne({ email });

  if (!admin) {
    return { message: 'User not found' };
  }

  // 2️⃣ OTP generate karo (6 digit random)
  const otp = crypto.randomInt(100000, 999999).toString();

  // 3️⃣ OTP expiry time set karo (5 min baad expire)
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // 4️⃣ DB me admin ko update karo OTP aur expiry ke sath
  admin.otp = otp;
  admin.otpExpiresAt = otpExpiresAt;
  await admin.save();

  // 5️⃣ Email bhejo OTP
  await this.otpService.sendOtp(admin.email, otp);

    const newToken = this.jwtService.sign(
    {
      sub: admin._id,
      email: admin.email,
      role: admin.role,
    },
    { expiresIn: '30d' }
  );

  return {
    message: 'OTP sent on email for password reset.',
    data: {
      otp,
      token: newToken, // ⚠️ sirf testing/debug ke liye return karna, production me usually return nahi karte
    },
  };
}

async resetPassword(email: string, otp: string, newPassword: string) {
  try {
    // 🔍 Admin model use karo
    const admin = await this.databaseService.repositories.AdminModel.findOne({ email });
    if (!admin) {
      throw new UnauthorizedException('Admin not found');
    }

    console.log ("wali", email, otp, newPassword)

    
   if (admin.otp !== otp.toString()) {
  console.log("DB OTP:", admin.otp, " Provided OTP:", otp); // Debugging
  throw new UnauthorizedException('Invalid OTP');
}

   
    const now = new Date();
    if (!admin.otpExpiresAt || now > admin.otpExpiresAt) {
      throw new UnauthorizedException('OTP has expired');
    }

   
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    
    admin.password = hashedPassword;
    admin.otp = null;
    admin.otpExpiresAt = null;
    await admin.save();

    return {
      message: 'Your password has been changed successfully',
    };
  } catch (error) {
    throw new UnauthorizedException(error.message || 'Password reset failed');
  }
}

async loginAdmin(loginData: any) {
  try {
    const {  email, password } = loginData;

   const admin = await this.databaseService.repositories.AdminModel.findOne({ email });
    if (!admin) {
      throw new UnauthorizedException('Invalid credentials' );
    }

    const isPasswordMatch = await bcrypt.compare(password, admin.password);
    if (!isPasswordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const newToken = this.jwtService.sign(
    {
      sub: admin._id,
      email: admin.email,
      role: admin.role,
    },
    { expiresIn: '30d' }
  );

    return {
      message: 'Login successful',
      data: {
      token: newToken,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
      },
    };
  } catch (error) {
    throw new UnauthorizedException(error.message || 'Login failed');
  }
}

async getProfile(userId: string) {
  console.log(userId)
  try {
    if (!userId ) {
      throw new UnauthorizedException('Invalid user credentials');
    }
     const school = await this.databaseService.repositories.SchoolModel.findOne({
    admin: new mongoose.Types.ObjectId(userId) // admin field match kar raha hai
    });
    if (!school) {
      throw new UnauthorizedException('school not found');
    }

    // ✅ 3. Wrap response in data
    return {
      message: 'school profile fetched successfully',
      data: school,
    };
  } catch (error) {
    throw new UnauthorizedException(error.message || 'Failed to fetch school profile');
  }
}

async getallschool() {

  const school =  await this.databaseService.repositories.SchoolModel.find().exec();
    return {
      message: 'All school fetched successfully',
      data: school,
    }; // DB se direct fetch
  }

  async addKid(AddStudentDto: AddStudentDto, AdminId: string, parentEmail: string) {

const adminObjectId = new Types.ObjectId(AdminId);

  const school = await this.databaseService.repositories.SchoolModel.findOne({ admin: adminObjectId });

  if (!school) {
    throw new UnauthorizedException('School not found');
  }

  
  // Step 2: Find parent by email
  let parent = await this.databaseService.repositories.parentModel.findOne({ email: parentEmail });


  

  // Step 3: If parent not found, create new parent
  if (!parent) {
    const username = parentEmail.split('@')[0];
    
    const randomPassword = crypto.randomBytes(6).toString('hex'); 


  const hashedPassword = await bcrypt.hash(randomPassword, 10);

  await this.otpService.sendPassword(parentEmail, randomPassword);

    parent = new this.databaseService.repositories.parentModel({
      email: parentEmail,
      fullname: username,
      schoolId: school._id,
      password: hashedPassword,
      isVerified: true,
    });
    parent = await parent.save();
  }

  // Step 4: Create kid with parentId & schoolId
  const newKid = new this.databaseService.repositories.KidModel({
    ...AddStudentDto,
    schoolId: school._id,
    parentId: parent._id,
  });

  const savedKid = await newKid.save();

  // Step 5: Return response
  return {
    message: 'Kid added successfully',
    data: savedKid,
  };
}

async getKids(AdminId: string, page = 1, limit = 10, search?: string) {
  const adminObjectId = new Types.ObjectId(AdminId);

  // Step 1: find school
  const school = await this.databaseService.repositories.SchoolModel.findOne({ admin: adminObjectId });
  if (!school) {
    throw new UnauthorizedException("School not found");
  }

  const skip = (page - 1) * limit;

  // Step 2: aggregation pipeline
  const pipeline = [
    {
      $match: {
        schoolId: school._id.toString(),
        ...(search ? { fullname: { $regex: search, $options: "i" } } : {})
      }
    },
    {
      $addFields: {
        vanObjectId: {
          $cond: {
            if: { $and: [{ $ne: ["$VanId", null] }, { $ne: ["$VanId", ""] }] },
            then: { $toObjectId: "$VanId" },
            else: null
          }
        }
      }
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
      $lookup: {
        from: "vans",
        localField: "vanObjectId",
        foreignField: "_id",
        as: "van"
      }
    },
    { $unwind: { path: "$van", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "drivers",
        localField: "van.driverId",
        foreignField: "_id",
        as: "driver"
      }
    },
    { $unwind: { path: "$driver", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        student: {
          id: { $toString: "$_id" },
          parentId: { $cond: [{ $ifNull: ["$parentId", false] }, { $toString: "$parentId" }, null] },
          vanId: "$VanId",
          schoolId: "$schoolId",
          fullname: { $ifNull: ["$fullname", ""] },
          gender: { $ifNull: ["$gender", ""] },
          grade: { $ifNull: ["$grade", ""] },
          image: { $ifNull: ["$image", ""] },
          status: { $ifNull: ["$status", ""] },
          age: { $ifNull: ["$age", null] },
          dob: { $ifNull: ["$dob", null] }
        },
        parent: {
          id: { $cond: [{ $ifNull: ["$parent._id", false] }, { $toString: "$parent._id" }, null] },
          schoolId: "$parent.schoolId",
          fullname: { $ifNull: ["$parent.fullname", ""] },
          email: { $ifNull: ["$parent.email", ""] },
          phoneNo: { $ifNull: ["$parent.phoneNo", ""] },
          address: { $ifNull: ["$parent.address", ""] },
          image: { $ifNull: ["$parent.image", ""] }
        },
        van: {
          id: { $cond: [{ $ifNull: ["$van._id", false] }, { $toString: "$van._id" }, null] },
          driverId: { $cond: [{ $ifNull: ["$van.driverId", false] }, { $toString: "$van.driverId" }, null] },
          schoolId: "$van.schoolId",
          venImage: { $ifNull: ["$van.venImage", ""] },
          cnic: { $ifNull: ["$van.cnic", ""] },
          vehicleType: { $ifNull: ["$van.vehicleType", ""] },
         
          assignRoute: { $ifNull: ["$van.assignRoute", ""] },
         
          carNumber: { $ifNull: ["$van.carNumber", ""] },
        
        },
        driver: {
          id: { $cond: [{ $ifNull: ["$driver._id", false] }, { $toString: "$driver._id" }, null] },
          schoolId: "$driver.schoolId",
          fullname: { $ifNull: ["$driver.fullname", ""] },
          email: { $ifNull: ["$driver.email", ""] },
          phoneNo: { $ifNull: ["$driver.phoneNo", ""] },
          address: { $ifNull: ["$driver.address", ""] },
          image: { $ifNull: ["$driver.image", ""] }
        },
        _id: 0
      }
    },
    { $skip: skip },
    { $limit: limit }
  ];

  const kids = await this.databaseService.repositories.KidModel.aggregate(pipeline);

  const total = await this.databaseService.repositories.KidModel.countDocuments({
    schoolId: school._id.toString(),
    ...(search ? { fullname: { $regex: search, $options: "i" } } : {})
  });

  return {
    message: "Kids fetched successfully",
    data: kids,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

async editStudent(KidId: string, AdminId: string, editStudentDto: EditStudentDto) {
  const adminObjectId = new Types.ObjectId(AdminId);

  // Step 1: Find school by admin
  const school = await this.databaseService.repositories.SchoolModel.findOne({ admin: adminObjectId });
  if (!school) {
    throw new UnauthorizedException('School not found');
  }

  // Step 2: Find kid by id and schoolId (security check)
  const kid = await this.databaseService.repositories.KidModel.findOne({
    _id: KidId,
    schoolId: school._id,
  });

  if (!kid) {
    throw new UnauthorizedException ('Kid not found');
  }

  // Step 3: Update kid with DTO
  const updatedKid = await this.databaseService.repositories.KidModel.findByIdAndUpdate(
    KidId,
    { $set: editStudentDto },
    { new: true }, // return updated document
  );

  return {
    message: 'Kid updated successfully',
    data: updatedKid,
  };
}

async removeKids(AdminId: string, kidIds: string[]) {
  const adminObjectId = new Types.ObjectId(AdminId);

  // Step 1: Find school by admin
  const school = await this.databaseService.repositories.SchoolModel.findOne({ admin: adminObjectId });
  if (!school) {
    throw new UnauthorizedException('School not found');
  }

  // Step 2: Update each kid whose schoolId matches
  const result = await this.databaseService.repositories.KidModel.updateMany(
    { _id: { $in: kidIds }, schoolId: school._id },
    { $set: { schoolId: null } }
  );

  return {
    message: 'Kids remove from School successfully',
  };
}

async getKidById(kidId: string, AdminId: string) {


    const adminObjectId = new Types.ObjectId(AdminId);

  // Step 1: Find school by admin
  const school = await this.databaseService.repositories.SchoolModel.findOne({ admin: adminObjectId });
  if (!school) {
    throw new UnauthorizedException('School not found');
  }
  // 1. Kid find karo
  const kid = await this.databaseService.repositories.KidModel.findById(kidId);

  if (!kid) {
    throw new BadRequestException("Kid not found");
  }

  // 2. Parent find karo using parentId
  const parent = await this.databaseService.repositories.parentModel.findById(kid.parentId);
  const van = await this.databaseService.repositories.VanModel.findById(kid.VanId);





  // 3. Response banao (kid + parent email)
  return {
    message: "Kid fetched successfully",
    data: {
      id: kid._id,
      fullname: kid.fullname,
      age: kid.age,
      grade: kid.grade,
      gender: kid.gender,
      dob: kid.dob,
      schoolId: school._id,
      parentId: kid.parentId,
      VanId: kid.VanId || null,
      image: kid.image || "",
      status: kid.status || "pending",
      parentEmail: parent ? parent.email : null,
      parentName: parent? parent.fullname : null , // agar parent mila to email, warna null
      vehicleType: van ? van.vehicleType : null,
      route: van ? van.assignRoute : null,
      carNumber: van ? van.carNumber : null,
      schoolName: school.schoolName


    }
  };
}

async getVansBySchoolAdmin(adminId: string, page = 1, limit = 10) {
  const adminObjectId = new Types.ObjectId(adminId);

  // Step 1: find school by adminId
  const school = await this.databaseService.repositories.SchoolModel.findOne({ admin: adminObjectId });
  if (!school) {
    throw new UnauthorizedException("School not found");
  }

  const skip = (page - 1) * limit;

  // Step 2: aggregation pipeline
  const pipeline = [
    {
      $match: {
        schoolId: school._id.toString()
      }
    },
    {
      $addFields: {
        driverObjectId: {
          $cond: {
            if: { $and: [{ $ne: ["$driverId", null] }, { $ne: ["$driverId", ""] }] },
            then: { $toObjectId: "$driverId" },
            else: null
          }
        }
      }
    },
   {
    $sort: { createdAt: -1 } // 👈 newest vans first by creation date
  },
    {
      $lookup: {
        from: "drivers",
        localField: "driverObjectId",
        foreignField: "_id",
        as: "driver"
      }
    },
    { $unwind: { path: "$driver", preserveNullAndEmptyArrays: true } },

 

    {
      $project: {
        _id: 0,
        van: {
          id: { $toString: "$_id" },
          schoolId: "$schoolId",
          driverId: { $cond: [{ $ifNull: ["$driverId", false] }, { $toString: "$driverId" }, null] },
          venImage: { $ifNull: ["$venImage", ""] },
          vehicleType: { $ifNull: ["$vehicleType", ""] },
          assignRoute: { $ifNull: ["$assignRoute", ""] },
          carNumber: { $ifNull: ["$carNumber", ""] },
          condition: { $ifNull: ["$condition", "good"] },
          deviceId: { $ifNull: ["$deviceId", ""] },
          status: { $ifNull: ["$status", "inactive"] }
        },
        driver: {
          id: { $cond: [{ $ifNull: ["$driver._id", false] }, { $toString: "$driver._id" }, null] },
          fullname: { $ifNull: ["$driver.fullname", ""] },
          email: { $ifNull: ["$driver.email", ""] },
          phoneNo: { $ifNull: ["$driver.phoneNo", ""] },
          image: { $ifNull: ["$driver.image", ""] }
        }
      }
    },
    { $skip: skip },
    { $limit: limit }
  ];

 const vans = await this.databaseService.repositories.VanModel.aggregate(pipeline as any);


  // Step 3: total count for pagination
  const total = await this.databaseService.repositories.VanModel.countDocuments({
    schoolId: school._id.toString()
  });

  return {
    message: "Vans fetched successfully",
    data: vans,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}




}