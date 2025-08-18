/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from "src/database/databaseservice";
import { OtpService } from 'src/user/schema/otp/otp.service';

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

  // Step 1: Admin create karo (password optional)
  const admin = await this.databaseService.repositories.AdminModel.create({
    ...adminInfo,
  });

  // Step 2: Token banao
  const token = this.jwtService.sign(
    {
      sub: admin._id,
      email: admin.email,
      role: admin.role,
    },
    { expiresIn: '30d' } // 30 minutes validity
  );

  // Step 3: Call OTP service ka function to send email with link
  await this.otpService.sendTokenLink(admin.email, token);

  // Step 4: Create school with admin reference
  await this.databaseService.repositories.SchoolModel.create({
    ...schoolInfo,
    admin: admin._id,
  });

  return {
    message: 'Admin and school created. Token link sent on email for password setup.',
    data: {
    token
  }
  };
}

async setPasswordUsingEmail(email: string, password: string) {
  // 1️⃣ User check karo
  const admin = await this.databaseService.repositories.AdminModel.findOne({ email });

  if (!admin) {
    return { message: 'User not found' };
  }

  

  // 3️⃣ Password hash karo
  admin.password = await bcrypt.hash(password, 10);

  // 4️⃣ Save karo DB me
  await admin.save();

  // 5️⃣ Naya JWT generate karo
  const newToken = this.jwtService.sign(
    {
      sub: admin._id,
      email: admin.email,
      role: admin.role,
    },
    { expiresIn: '30d' }
  );

  // 6️⃣ Response
  return {
    message: 'Password set successfully',
    data: {
      token: newToken,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    }
  };
}

async forgotPasswordService(email: string) {
  // 1️⃣ User check karo
  const admin = await this.databaseService.repositories.AdminModel.findOne({ email });

  if (!admin) {
    return { message: 'User not found' };
  }

  const token = this.jwtService.sign(
    {
      sub: admin._id,
      email: admin.email,
      role: admin.role,
    },
    { expiresIn: '30d' } 
  );

 
  await this.otpService.sendTokenLink(admin.email, token);
  return {
    message: 'Token link sent on email for password setup.',
  };
}

async resetPasswordUsingEmail(email: string, password: string) {

   const hashedPassword = await bcrypt.hash(password, 10);

  const updatedAdmin = await this.databaseService.repositories.AdminModel.findOneAndUpdate(
    { email },                 // 1️⃣ FIND CONDITION → email ke basis pe document dhundo
    { password: hashedPassword }, // 2️⃣ UPDATE → us document ka `password` field ko `hashedPassword` se replace karo
    { new: true }              // 3️⃣ OPTIONS → updated document return karo (purana nahi)
);
   if (!updatedAdmin) {
    return { message: 'User not found' };
  }
  
  

  // 5️⃣ Naya JWT generate karo
  const newToken = this.jwtService.sign(
    {
      sub:  updatedAdmin._id,
      email: updatedAdmin.email,
      role:  updatedAdmin.role,
    },
    { expiresIn: '30d' }
  );

  // 6️⃣ Response
  return {
    message: 'password reset successfully',
    data: {
      token: newToken,
      user: {
        id:  updatedAdmin._id,
        name:  updatedAdmin.name,
        email:  updatedAdmin.email,
        role:  updatedAdmin.role
      }
    }
  };
}

async loginAdmin(loginData: any) {
  try {
    const {  email, password } = loginData;

   const admin = await this.databaseService.repositories.AdminModel.findOne({ email });
    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
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