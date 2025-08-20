/* eslint-disable prettier/prettier */
import {
  Controller,
  Post,
  Get,
  Param,
  Patch,
  Delete,
  Body,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { AdminService } from './admin.service'
import { AuthGuard } from '@nestjs/passport';
import { UseGuards } from '@nestjs/common';


@Controller('Admin')
export class AdminController {
  constructor(private readonly  adminService:  AdminService) {}
  @UseGuards(AuthGuard('jwt'))
@Post('create-admin-school')
async createAdminAndSchool(@Req() req, @Body() body: any) {
  // role check
  if (req.user.role !== 'superadmin') {
    throw new UnauthorizedException('Only superadmins can access this API');
  }

  return this.adminService.createAdminAndSchool(body);
}

    

   @UseGuards(AuthGuard('jwt'))
  @Post('forgot-password')
  async forgotPassword(@Req() req) {
    const email = req.user.email; // JWT strategy me jo payload return hota hai, usme email hai

    return this.adminService.forgotPasswordService(email);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('resend-otp')
  async resendotp(@Req() req) {
    const email = req.user.email; // JWT strategy me jo payload return hota hai, usme email hai

    return this.adminService.resendOtpForResetPassword(email);
  }

   @UseGuards(AuthGuard('jwt'))
  @Post('reset-password')
  async resetPassword(@Req() req, @Body() body: any) {
    const email = req.user.email; // JWT strategy me jo payload return hota hai, usme email hai
    const { newPassword, otp } = body;

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
}

