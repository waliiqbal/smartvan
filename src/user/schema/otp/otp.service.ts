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
        from: 'farazahmed.fa276@gmail.com',  // 🟢 same Gmail as above
        to: toEmail,
        subject: 'Your OTP Code',
        text: `Your OTP code is: ${otp}`,
        html: `<p>Your OTP code is: <b>${otp}</b></p>`, // Optional: styled message
      };

      // 🔥 Actual line that sends the email
      const result = await this.transporter.sendMail(mailOptions);

      // Log success
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
  <div style="font-family: Arial, sans-serif; line-height:1.6; max-width: 560px; margin: 0 auto; padding: 16px; border: 1px solid #eee; border-radius: 8px;">
    <h2 style="margin: 0 0 12px;">Your Account Password</h2>
    <p>We’ve created an account for you. Use the password below to sign in.</p>
    <div style="background:#f7f7f7; padding:12px 16px; border-radius:6px; font-size:16px; letter-spacing:0.5px; display:inline-block;">
      <strong>${password}</strong>
    </div>
    <p style="margin-top:16px;">For your security, <b>log in and change this password if needed</b> from your profile/settings.</p>
    <p style="color:#666; font-size:12px; margin-top:12px;">If you didn’t expect this email, you can ignore it.</p>
  </div>
`,
    };

    const result = await this.transporter.sendMail(mailOptions);
    this.logger.log(`✅ Temporary password sent to ${toEmail}: ${result.response}`);
  } catch (error) {
    this.logger.error(`❌ Failed to send temporary password to ${toEmail}`, error);
    throw new Error('Failed to send temporary password email');
  }
}

}