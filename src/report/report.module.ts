/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';




@Module({
 
  controllers: [ReportController],
  providers: [ReportService], 
  exports: [ReportService], 
})
// eslint-disable-next-line prettier/prettier
export class ReportModule {}