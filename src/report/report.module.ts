/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { ReportController } from './report.controller';
import { ReportService } from './report.service'
import { FirebaseAdminModule} from '../notification/firebase.module';



@Module({
 
  controllers: [ReportController],
  providers: [ReportService], 
  exports: [ReportService], 
   imports: [FirebaseAdminModule],
})
// eslint-disable-next-line prettier/prettier
export class ReportModule {}