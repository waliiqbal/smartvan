/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { FirebaseAdminService } from './firebase-admin.service';
import {notificationController} from './notification.controller'

@Module({
  controllers: [notificationController],
  providers: [FirebaseAdminService],
  exports: [FirebaseAdminService], // 
})
export class FirebaseAdminModule {}