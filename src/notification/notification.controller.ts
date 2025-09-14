/* eslint-disable prettier/prettier */
import { Body, Controller, Post, Get,  Req, Query } from '@nestjs/common';
import { FirebaseAdminService } from './firebase-admin.service';
import { AuthGuard } from '@nestjs/passport';
import { UseGuards } from '@nestjs/common';


@Controller('notification')
export class notificationController {
  constructor(private readonly firebaseAdminService: FirebaseAdminService) {}

  @UseGuards(AuthGuard('jwt'))
 @Get('getAlerts')
  async getAlert(
   
    @Req() req: any
  ) {
    const parentId = req.user.userId; 
    return this.firebaseAdminService.getAlerts(parentId)
  }

}