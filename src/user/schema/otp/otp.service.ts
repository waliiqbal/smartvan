/* eslint-disable prettier/prettier */
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class OtpService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(OtpService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'farazahmed.fa276@gmail.com',        // 🟢 apna Gmail daalo yahan
        pass: 'saqqwgcfseysoikf',               // 🟢 Gmail app password without spaces
      },
    });
  }

  async sendOtp(toEmail: string, otp: string): Promise<void> {
    try {
      const mailOptions = {
        from: 'farazahmed.fa276@gmail.com',  
        to: toEmail,
        subject: 'Your OTP Code',
        text: `Your OTP code is: ${otp}`,
        html: `<p>Your OTP code is: <b>${otp}</b></p>`, 
      };

     
      const result = await this.transporter.sendMail(mailOptions);

      
      this.logger.log(`OTP email sent to ${toEmail}: ${result.response}`);
    } catch (error) {
      // Log error
      this.logger.error(`Failed to send OTP to ${toEmail}`, error);
      throw new Error('Failed to send OTP email');
    }
  }

async sendPassword(toEmail: string, password: string): Promise<void> {
  try {
    const mailOptions = {
      from: 'farazahmed.fa276@gmail.com',
      to: toEmail,
      subject: 'Your Password',
      text: `Your password is: ${password}

`,
    html: `
  <div style="font-family: Arial, sans-serif; line-height:1.6; max-width: 560px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background:#ffffff;">
    
    <!-- App / System Heading -->
    <h1 style="text-align:center; color:#4f46e5; margin-bottom:4px;">
      Smart Van
    </h1>
    <p style="text-align:center; color:#666; font-size:14px; margin-top:0;">
      School Management System
    </p>

    <hr style="border:none; border-top:1px solid #eee; margin:20px 0;" />

    <!-- Login Heading -->
    <h2 style="text-align:center; color:#333;">Login to Your Account</h2>

    <p>Your admin account has been created successfully. Use the credentials below to log in.</p>

    <!-- Credentials Box -->
    <div style="background:#f7f7f7; padding:16px; border-radius:6px; margin:16px 0;">
      <p style="margin:6px 0;"><b>Email:</b> ${toEmail}</p>
      <p style="margin:6px 0;"><b>Password:</b> ${password}</p>
    </div>

    <!-- Login Button -->
    <div style="text-align:center; margin:24px 0;">
      <a href="https://smartvanride.com/auth/signin"
         style="background:#4f46e5; color:#fff; padding:12px 24px; text-decoration:none; border-radius:6px; display:inline-block;">
        Login Now
      </a>
    </div>

    <p style="font-size:14px;">
      After logging in, we recommend changing your password from your profile settings.
    </p>

    <p style="color:#777; font-size:12px; margin-top:16px;">
      If you did not expect this email, you can safely ignore it.
    </p>
  </div>
`
,
    };

    const result = await this.transporter.sendMail(mailOptions);
    this.logger.log(`✅ Temporary password sent to ${toEmail}: ${result.response}`);
  } catch (error) {
    this.logger.error(`❌ Failed to send temporary password to ${toEmail}`, error);
    throw new Error('Failed to send temporary password email');
  }
}

}


// /* eslint-disable prettier/prettier */
// import { Injectable, Logger } from '@nestjs/common';
// import * as nodemailer from 'nodemailer';

// @Injectable()
// export class OtpService {
//   private transporter: nodemailer.Transporter;
//   private readonly logger = new Logger(OtpService.name);

//   constructor() {
//     this.transporter = nodemailer.createTransport({
//       host: 'smtp.hostinger.com',
//       port: 587,          // TLS port (recommended)
//       secure: false,      // false for 587
//       auth: {
//         user: 'info@smartvan.pk',   // your SmartVan email
//         pass: 'EMAIL_PASSWORD',     // same password as webmail
//       },
//     });

//     // Optional: verify connection
//     this.transporter.verify()
//       .then(() => this.logger.log('✅ SMTP ready'))
//       .catch(err => this.logger.error('❌ SMTP error', err));
//   }

//   async sendOtp(toEmail: string, otp: string): Promise<void> {
//     try {
//       const mailOptions = {
//         from: 'Smart Van <info@smartvan.pk>',
//         to: toEmail,
//         subject: 'Your OTP Code',
//         text: `Your OTP code is: ${otp}`,
//         html: `<p>Your OTP code is: <b>${otp}</b></p>`,
//       };

//       const result = await this.transporter.sendMail(mailOptions);
//       this.logger.log(`OTP email sent to ${toEmail}: ${result.response}`);

//     } catch (error) {
//       this.logger.error(`Failed to send OTP to ${toEmail}`, error);
//       throw new Error('Failed to send OTP email');
//     }
//   }

//   async sendPassword(toEmail: string, password: string): Promise<void> {
//     try {
//       const mailOptions = {
//         from: 'Smart Van <info@smartvan.pk>',
//         to: toEmail,
//         subject: 'Your Password',
//         text: `Your password is: ${password}`,
//         html: `
//         <div style="font-family: Arial, sans-serif; line-height:1.6; max-width: 560px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background:#ffffff;">
          
//           <h1 style="text-align:center; color:#4f46e5;">Smart Van</h1>
//           <p style="text-align:center; color:#666;">School Management System</p>

//           <hr style="border-top:1px solid #eee;" />

//           <h2 style="text-align:center;">Login to Your Account</h2>

//           <p>Your admin account has been created successfully.</p>

//           <div style="background:#f7f7f7; padding:16px; border-radius:6px;">
//             <p><b>Email:</b> ${toEmail}</p>
//             <p><b>Password:</b> ${password}</p>
//           </div>

//           <div style="text-align:center; margin:20px 0;">
//             <a href="https://smartvanride.com/auth/signin"
//                style="background:#4f46e5; color:#fff; padding:12px 24px; text-decoration:none; border-radius:6px;">
//               Login Now
//             </a>
//           </div>

//           <p>We recommend changing your password after login.</p>

//           <p style="color:#777; font-size:12px;">
//             If you did not expect this email, ignore it.
//           </p>
//         </div>
//         `,
//       };

//       const result = await this.transporter.sendMail(mailOptions);
//       this.logger.log(`✅ Password email sent to ${toEmail}: ${result.response}`);

//     } catch (error) {
//       this.logger.error(`❌ Failed to send password to ${toEmail}`, error);
//       throw new Error('Failed to send password email');
//     }
//   }
// }
