/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { KidService } from './kid.service';
import { KidController } from './kid.controller';
import { FirebaseAdminModule } from 'src/notification/firebase.module';
import { AdminController } from 'src/admin/admin.controller';




@Module({
 
  controllers: [KidController],
  providers: [KidService], 
  exports: [KidService], 
  imports: [FirebaseAdminModule],
})
// eslint-disable-next-line prettier/prettier
export class KidModule {}