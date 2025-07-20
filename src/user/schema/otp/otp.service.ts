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
}