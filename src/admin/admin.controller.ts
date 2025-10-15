/* eslint-disable prettier/prettier */
import {
  Controller,
  Post,
  Get,
  Param,
  Patch,
  Delete,
  Query,
  Body,
  Req,
  UnauthorizedException,

} from '@nestjs/common';
import { AdminService } from './admin.service'
import { AuthGuard } from '@nestjs/passport';
import { UseGuards } from '@nestjs/common';
import { AddStudentDto } from './dto/addStudent.dto';
import { EditStudentDto } from './dto/editStudent.dto';
import { KidService } from 'src/Kid/kid.service';


@Controller('Admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly kidService: KidService,   // 👈 inject KidService here
  ) {}
  @UseGuards(AuthGuard('jwt'))
@Post('create-admin-school')
async createAdminAndSchool(@Req() req, @Body() body: any) {
  // role check
  if (req.user.role !== 'superadmin') {
    throw new UnauthorizedException('Only superadmins can access this API');
  }

  return this.adminService.createAdminAndSchool(body);
}

    

 
  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.adminService.forgotPasswordService(email);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('resend-otp')
  async resendotp(@Req() req) {
    const email = req.user.email; // JWT strategy me jo payload return hota hai, usme email hai

    return this.adminService.resendOtpForResetPassword(email);
  }

 
  @Post('reset-password')
  async resetPassword(@Req() req, @Body() body: any) {
    // JWT strategy me jo payload return hota hai, usme email hai
    const { email, otp, newPassword } = body;

    return this.adminService.resetPassword(email, otp, newPassword);
  }

    @Post('login')
  async login(@Body() loginData: any) {
    return this.adminService.loginAdmin(loginData);
  }

    @UseGuards(AuthGuard('jwt'))
      @Get('getProfile')
    async getKids(@Req() req: any) {
      const  userId  = req.user.userId; // 👈 token se extract hua
      return this.adminService.getProfile(userId);
    }

    @Get('getAllSchools')
async getAllSchools() {
  return this.adminService.getallschool(); // service ko direct call, kuch pass nahi kar rahe
}
@UseGuards(AuthGuard('jwt'))
@Post('addStudent')
async addKid(
  @Body() AddStudentDto : AddStudentDto , // sirf kid ke fields
  @Body('parentEmail') parentEmail: string, // alag se lo
  @Req() req: any,
) {
  const AdminId = req.user.userId;
  return this.adminService.addKid(AddStudentDto , AdminId, parentEmail);
}

@UseGuards(AuthGuard('jwt'))
@Post('editStudent')
async editKid(
  @Body() EditStudentDto : EditStudentDto , // sirf kid ke fields
  @Body('KidId') KidId: string, // alag se lo
  @Req() req: any,
) {
  const AdminId = req.user.userId;
  return this.adminService.editStudent(KidId , AdminId, EditStudentDto );
}

 @UseGuards(AuthGuard('jwt')) // JWT Auth Guard use
  @Get("Get-Students")
  async getstudent(
    @Req() req: any, // request object, JWT decoded user info milega
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search?: string,
  ) {
    // JWT token se AdminId nikal lo
    const adminId = req.user.userId; // assuming AuthGuard ne req.user me user data daala

    if (!adminId) {
      throw new UnauthorizedException('Admin not found in token');
    }

    // page aur limit ko number me convert karo
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;

    // service call
    return this.adminService.getKids(adminId, pageNumber, limitNumber, search);

  
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('removeStudents')
  async removeSchoolFromKids(
    @Req() req: any,
    @Body('kidIds') kidIds: string[], // array of kidIds
  ) {
    const adminId = req.user.userId;

    if (!adminId) {
      throw new UnauthorizedException('Admin not found in token');
    }

    if (!kidIds || !Array.isArray(kidIds) || kidIds.length === 0) {
      throw new UnauthorizedException('kidIds must be a non-empty array');
    }

    return this.adminService.removeKids(adminId, kidIds);
  }
  @Get("getStudentById/:id")
async getKid(@Param("id") id: string) {
  return this.adminService.getKidById(id);
}

@UseGuards(AuthGuard('jwt'))
@Post('assignVanToStudent')
async assignVanToStudent(
  @Body('kidId') kidId: string,
  @Body('vanId') vanId: string,
  @Req() req: any,
) {
  const adminId = req.user.userId;
  return this.kidService.assignVanToStudent(kidId, vanId, adminId);
}

@UseGuards(AuthGuard('jwt'))
@Post('assignVanToDriver')
async assignVanToDriver(
  @Body('driverId') driverId: string,
  @Body('vanId') vanId: string,
  @Req() req: any,
) {
  const adminId = req.user.userId;
  return this.kidService.assignVanToDriver(driverId, vanId, adminId);
}

@UseGuards(AuthGuard('jwt'))
@Get("Get-Vans-By-SchoolAdmin")
async getVansBySchoolAdmin(@Req() req: any) {
  const adminId = req.user.userId;
  if (!adminId) throw new UnauthorizedException("Admin not found in token");

  return this.adminService.getVansBySchoolAdmin(adminId);
}

}

