/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException } from '@nestjs/common';
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

  
  const admin = await this.databaseService.repositories.AdminModel.create({
    ...adminInfo,
    password: hashedPassword,
  });

 
  const token = this.jwtService.sign(
    {
      sub: admin._id,
      email: admin.email,
      role: admin.role,
    },
    { expiresIn: '30d' }
  );


  await this.databaseService.repositories.SchoolModel.create({
    ...schoolInfo,
    admin: admin._id,
  });

 
  await this.otpService.sendPassword(admin.email, randomPassword);

  return {
    message: 'Admin and school created. Password sent on email.',
    data: {
      token,
      
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

  return {
    message: 'OTP sent on email for password reset.',
    data: {
      otp, // ⚠️ sirf testing/debug ke liye return karna, production me usually return nahi karte
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
    const username = parentEmail.split('@')[0]; // email ka @ se pehle wala part
    parent = new this.databaseService.repositories.parentModel({
      email: parentEmail,
      fullname: username,
      schoolId: school._id,
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

  // school find
  const school = await this.databaseService.repositories.SchoolModel.findOne({ admin: adminObjectId });
  if (!school) {
    throw new UnauthorizedException("School not found");
  }

  // query prepare
  const query: any = { schoolId: school._id };
  if (search) {
    query.fullname = { $regex: search, $options: "i" }; // name search with regex
  }

  const skip = (page - 1) * limit;

  // kids find
  const kids = await this.databaseService.repositories.KidModel.find(query)
    .skip(skip)
    .limit(limit)
    .lean();

  const result = [];

  for (const kid of kids) {
    // parent find
    const parent = kid.parentId
      ? await this.databaseService.repositories.parentModel.findById(kid.parentId)
          .select("-password")
          .lean()
      : null;

    // van find (kid.vanId is string)
    const van = kid.VanId
      ? await this.databaseService.repositories.VanModel.findOne({ _id: kid.VanId }).lean()
      : null;

    // driver find (from van.driverId)
    let driver = null;
    if (van?.driverId) {
      driver = await this.databaseService.repositories.driverModel.findById(van.driverId)
        .select("-password")
        .lean();
    }

    // map structure + datatype handilation
    const mappedKid = {
      student: {
        id: kid?._id?.toString() || null,
        parentId: kid?.parentId?.toString() || null,
        vanId: kid?.VanId || null,
        schoolId: kid?.schoolId || null,
        fullname: kid?.fullname || "",
        gender: kid?.gender || "",
        grade: kid?.grade || "",
        status: kid?.status || "",
        age: kid?.age ?? null,
        dob: kid?.dob || null,
      },
      parent: {
        id: parent?._id?.toString() || null,
        schoolId: parent?.schoolId || null,
        fullname: parent?.fullname || "",
        email: parent?.email || "",
        phoneNo: parent?.phoneNo || "",
        address: parent?.address || "",
        image: parent?.image || "",
      },
      van: {
        id: van?._id?.toString() || null,
        driverId: van?.driverId?.toString() || null,
        schoolId: van?.schoolId || null,
        venImage: van?.venImage || "",
        cnic: van?.cnic || "",
        vehicleType: van?.vehicleType || "",
        venCapacity: van?.venCapacity ?? null,
        assignRoute: van?.assignRoute || "",
        licenceImageFront: van?.licenceImageFront || "",
        licenceImageBack: van?.licenceImageBack || "",
        carNumber: van?.carNumber || "",
        vehicleCardImage: van?.vehicleCardImage || "",
      },
      driver: {
        id: driver?._id?.toString() || null,
        schoolId: driver?.schoolId || null,
        fullname: driver?.fullname || "",
        email: driver?.email || "",
        phoneNo: driver?.phoneNo || "",
        address: driver?.address || "",
        image: parent?.image || "",
      },
    };

    result.push(mappedKid);
  }

  const total = await this.databaseService.repositories.KidModel.countDocuments(query);

  return {
    message: "Kids fetched successfully",
    data: result,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
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


  

}