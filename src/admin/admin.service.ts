/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from "src/database/databaseservice";
import { OtpService } from 'src/user/schema/otp/otp.service';
import * as crypto from 'crypto';

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

  

}