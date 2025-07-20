/* eslint-disable prettier/prettier */
import { Body, Controller, Post, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { SocialLoginDto } from './dto/social-login.dto';



@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ✅ Signup
  @Post('registeruser')
  async signup(@Body() signupDto:RegisterDto ) {
    return this.authService.registerUser(signupDto);
  }

  

   @Post('resend-otp') // ✅ POST /auth/resend-otp
  async resendOtp(@Body() body: { email: string; userType: string }) {
    const { email, userType } = body;
    return this.authService.resendOtp(email, userType);
  }

   @Post('login')
  async login(@Body() loginData: any) {
    return this.authService.loginUser(loginData);
  }

  @Post('verifyOtp') // ✅ POST /auth/resend-otp
  async verifyOtp(@Body() body: { email: string; userType: string, otp: string }) {
    const { email, userType, otp } = body;
    return this.authService.verifyOtp(email, userType, otp);
  }

  @Get('getprofile')
async getProfile(@Query('token') token: string) {
  return this.authService.getProfile(token);
}
 @Post('social-login')
  async socialLogin(@Body() body: any) {
  const { authProvider, token, userType } = body;
  return this.authService.socialLogin(authProvider, token, userType);
}

 @Post('forgot-password')
  async forgotPassword(
    @Body('email') email: string,
    @Body('userType') userType: string,
  ) {
    return this.authService.forgotPassword(email, userType);
  }

  @Post('resend-otp-reset-password') // ✅ POST /auth/resend-otp
  async resendOtpForResetPassword(@Body() body: { email: string; userType: string }) {
    const { email, userType } = body;
    return this.authService.resendOtpForResetPassword(email, userType);
  }

  @Post('reset-password')
  async resetPassword(
  @Body('email') email: string,
  @Body('userType') userType: string,
  @Body('otp') otp: string,
  @Body('newPassword') newPassword: string,
) {
  return this.authService.resetPassword(email, userType, otp, newPassword);
}
}



  // ✅ Login
//   @Post('login')
//   async login(@Body() loginDto: LoginDto) {
//     return this.authService.login(loginDto);
//   }

//   // ✅ Social Login
//   @Post('social-login')
//   async socialLogin(@Body() socialLoginDto: SocialLoginDto) {
//     return this.authService.socialLogin(socialLoginDto);
//   }
 