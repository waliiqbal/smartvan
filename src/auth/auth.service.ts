/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../user/schema/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/signup.dto';
import { SocialLoginDto  } from './dto/social-login.dto';
import { LoginDto } from './dto/login.dto';
import { DatabaseService } from "src/database/databaseservice";
import { OtpService } from 'src/user/schema/otp/otp.service';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';

@Injectable()
export class AuthService {
   private googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID); // 👈 Google Client
  constructor(
   
    private databaseService: DatabaseService,
    private readonly otpService: OtpService, 

    private readonly jwtService: JwtService
  ) {}


  private getUserModel(userType: string) {
  return userType === 'parent'
    ? this.databaseService.repositories.parentModel
    : this.databaseService.repositories.driverModel;
}

  // ✅ Signup
async registerUser(registerDto: RegisterDto) {
  try {
    const { userType, fullname, email, phoneNo, address, password, lat, long } = registerDto;

    const userModel = this.getUserModel(userType);

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    const user = new userModel({
      userType,
      fullname,
      email,
      phoneNo,
      address,
      lat,
      long,
      password: hashedPassword,
      otp,
      otpExpiresAt,
      isVerified: false,
    });

    await user.save();
    await this.otpService.sendOtp(email, otp);

    return {
      message: 'OTP sent successfully to your email/phone',
      userId: user._id,
      otp: user.otp
    };
  } catch (error) {
    throw new UnauthorizedException(error.message || 'Registration failed');
  }
}

async loginUser(loginData: any) {
  try {
    const { userType, email, password } = loginData;

    const userModel = this.getUserModel(userType);

    const user = await userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user._id,
      email: user.email,
      userType: user.userType
    };

    const token = await this.jwtService.signAsync(payload);

    return {
      message: 'Login successful',
      token,
      userId: user._id,
      fullname: user.fullname
    };
  } catch (error) {
    throw new UnauthorizedException(error.message || 'Login failed');
  }
}



async resendOtp(email: string, userType: string) {
  try {
    const userModel = this.getUserModel(userType);
    const user = await userModel.findOne({ email });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.isVerified) {
      throw new UnauthorizedException('User already verified');
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = newOtp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    await this.otpService.sendOtp(user.email, newOtp);

    return {
      message: 'New OTP sent successfully to your email',
      userId: user._id,
      otp: user.otp
    };
  } catch (error) {
    throw new UnauthorizedException(error.message || 'Resend OTP failed');
  }
}

async verifyOtp(email: string, userType: string, otp: string) {
  try {
    const userModel = this.getUserModel(userType);
    const user = await userModel.findOne({ email });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.isVerified) {
      throw new UnauthorizedException('User already verified');
    }

    if (user.otp !== otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    const currentTime = new Date();
    if (user.otpExpiresAt && currentTime > user.otpExpiresAt) {
      throw new UnauthorizedException('OTP has expired');
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();

    const payload = { sub: user._id, email: user.email, userType: user.userType };
    const token = this.jwtService.sign(payload, { expiresIn: '1h' });

    return {
      message: 'OTP verified successfully',
      token,
      user: {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        userType: user.userType,
        phoneNo: user.phoneNo,
        address: user.address,
      },
    };
  } catch (error) {
    throw new UnauthorizedException(error.message || 'OTP verification failed');
  }
}

async getProfile(token: string) {
  try {
    if (!token) {
      throw new UnauthorizedException('Token is required');
    }

    // ✅ 1. Token ko decode karo
    const decoded = this.jwtService.verify(token); // throws if invalid or expired

    const userId = decoded.sub;
    const userType = decoded.userType;

    if (!userId || !userType) {
      throw new UnauthorizedException('Invalid token');
    }

    // ✅ 2. Model choose karo userType ke base pe
    const userModel = this.getUserModel(userType); // parentModel or driverModel

    // ✅ 3. DB se user dhoondo
    const user = await userModel.findById(userId).select('-password -otp -otpExpiresAt');

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      message: 'User profile fetched successfully',
      user,
    };

  } catch (error) {
    throw new UnauthorizedException(error.message || 'Failed to fetch profile');
  }
}

async socialLogin(authProvider: string, token: string, userType: string) {
  try {
    let socialId: string;
    let email: string;
    let userName: string;

    // ✅ Step 1: Verify Google Token
    if (authProvider === 'google') {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      socialId = payload.sub;
      email = payload.email;
      userName = payload.name;
    }

    // ✅ Step 2: Verify Facebook Token
    else if (authProvider === 'facebook') {
      const fbResponse = await axios.get(
        `https://graph.facebook.com/me?fields=id,name,email&access_token=${token}`
      );
      socialId = fbResponse.data.id;
      email = fbResponse.data.email;
      userName = fbResponse.data.name;
    } else {
      throw new UnauthorizedException('Unsupported auth provider');
    }

    // ✅ Step 3: Get correct model by userType
    const model = this.getUserModel(userType);

    // ✅ Step 4: Check if already registered with password
    const userWithPassword = await model.findOne({
      email,
      password: { $ne: null },
    });

    if (userWithPassword) {
      throw new UnauthorizedException('This email is already registered with password. Use normal login.');
    }

    // ✅ Step 5: Check if social user already exists
    let user = await model.findOne({
      email,
      providerId: socialId,
      authProvider,
    });

    // ✅ Step 6: Create user if not exist
    if (!user) {
      user = new model({
        fullname: userName,
        email,
        providerId: socialId,
        authProvider,
        userType,
        isVerified: true,
      });

      await user.save();
    }

    // ✅ Step 7: Generate token
    const payload = {
      sub: user._id,
      email: user.email,
      userType: user.userType,
    };

    const jwtToken = this.jwtService.sign(payload, { expiresIn: '1h' });

    return {
      message: 'Social login successful',
      token: jwtToken,
      user: {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        userType: user.userType,
      },
    };
  } catch (error) {
    throw new UnauthorizedException(error.message || 'Social login failed');
  }
}
async forgotPassword(email: string, userType: string) {
  try {
    
    const model = this.getUserModel(userType);

 
    const user = await model.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('User not found with this email');
    }

    // 🔁 Step 3: OTP & expiry generate karo
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // ✍️ Step 4: Update OTP & expiry in DB
    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    // 📧 Step 5: Send OTP to user's email
    await this.otpService.sendOtp(user.email, otp);

    // ✅ Step 6: Response return
    return {
      message: 'OTP sent to your email for password reset',
      userId: user._id,
      otp: user.otp, 
    };
  } catch (error) {
    throw new UnauthorizedException(error.message || 'Forgot password failed');
  }
}

async resetPassword(email: string, userType: string, otp: string, newPassword: string) {
  try {
    // 🔍 Model choose karo
    const model = this.getUserModel(userType);

    // 🔍 User dhoondo
    const user = await model.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // ❌ OTP match nahi karta
    if (user.otp !== otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // ❌ OTP expire to nahi ho gaya
    const now = new Date();
    if (!user.otpExpiresAt || now > user.otpExpiresAt) {
      throw new UnauthorizedException('OTP has expired');
    }

    // ✅ Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // ✍️ Save new password & clear OTP fields
    user.password = hashedPassword;
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();

    return {
      message: 'Your password has been changed successfully',
    };
  } catch (error) {
    throw new UnauthorizedException(error.message || 'Password reset failed');
  }
}
 
async resendOtpForResetPassword(email: string, userType: string) {
  try {
    const userModel = this.getUserModel(userType);
    const user = await userModel.findOne({ email });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('User is not verified yet');
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = newOtp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    await this.otpService.sendOtp(user.email, newOtp);

    return {
      message: 'OTP sent successfully to your email for password reset',
      userId: user._id,
      otp: user.otp,
    };
  } catch (error) {
    throw new UnauthorizedException(error.message || 'Resend OTP for password reset failed');
  }
}




  // ✅ Login
//   async login(loginDto: LoginDto) {
//   try {
//     const { email, password } = loginDto;

//     const user = await this.databaseService.repositories.userModel.findOne({ email });

//     if (!user) {
//       throw new UnauthorizedException('User not found');
//     }

    
    
//     if (user.authProvider) {
//       throw new UnauthorizedException(
//         `This account is registered using ${user.authProvider} login. Use social login.`
//       );
//     }

//     // 🔐 Local user → check password
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       throw new UnauthorizedException('Invalid password');
//     }

//     // ✅ Generate token
//     const payload = { sub: user._id, email: user.email };
//     const token = this.jwtService.sign(payload);

//     return { message: 'Login successful', token };
//   } catch (error) {
//     throw new UnauthorizedException(error.message || 'Login failed');
//   }
// }
// async socialLogin(socialLoginDto: SocialLoginDto) {
//     try {
//       const { authProvider, token } = socialLoginDto;

//       let socialId: string;
//       let email: string;
//       let userName: string;

     
//       if (authProvider === 'google') {
//         const ticket = await this.googleClient.verifyIdToken({
//           idToken: token,
//           audience: process.env.GOOGLE_CLIENT_ID,
//         });

//         const payload = ticket.getPayload();
//         socialId = payload.sub;
//         email = payload.email;
//         userName = payload.name;
//       }

//       // ✅ Verify Facebook Token
//       else if (authProvider === 'facebook') {
//         const fbResponse = await axios.get(
//           `https://graph.facebook.com/me?fields=id,name,email&access_token=${token}`
//         );

//         socialId = fbResponse.data.id;
//         email = fbResponse.data.email;
//         userName = fbResponse.data.name;
//       }

 
//       else {
//         throw new UnauthorizedException('Unsupported auth provider');
//       }

   
//       let user = await this.databaseService.repositories.userModel.findOne({
//         providerId: socialId,
//         authProvider,
//       });

     
//       if (!user) {
//         user = new this.databaseService.repositories.userModel({
//           name: userName,
//           email,
//           providerId: socialId,
//           authProvider,
//         });

//         await user.save();
//       }

   
//       const payload = { sub: user._id, email: user.email };
//       const jwtToken = this.jwtService.sign(payload);

//       return { message: 'Social login successful', token: jwtToken };
//     } catch (error) {
//       throw new UnauthorizedException(error.message || 'Social login failed');
//     }
//   }
 }



