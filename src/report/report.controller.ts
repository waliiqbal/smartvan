/* eslint-disable prettier/prettier */

import { Controller, Post, Body, Req, Get } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UseGuards } from '@nestjs/common';
import { ReportService } from './report.service';


@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @UseGuards(AuthGuard('jwt')) // Token guard
  @Post("addReport")
  async createReport(@Body() body: any, @Req() req: any) {
    const parentId = req.user.userId; // token se parent ID
    return this.reportService.createReport(body, parentId);
  }

    @UseGuards(AuthGuard('jwt')) // Token guard
  @Post("addReportByDriver")
  async createReportByDriver(@Body() body: any, @Req() req: any) {
    const driverId = req.user.userId; // token se parent ID
    return this.reportService.createDriverReport(body, driverId);
  }
@Get('issue-types')
  getIssueTypes() {
    return {
      data: [
        'Van Arrived Late',
        'Child not picked/dropped',
        'Route Issue',
        'Driver Behavior',
        'Tracking Not Working',
        'Other',
      ],
    };
  }

  @Get('issue-types-Driver')
  getIssueTypesforDriver() {
    return {
      data: [
        'Vehicle Issue',
        'Running Late',
        'Passenger No-Show',
        'Emergency',
        'Tracking Not Working',
        'Other',
      ],
    };
  }
    @Post('addfaq')
  async addFaq(@Body() body: any) {
    return this.reportService.addFaq(body);
  }

  @Get("getFaq")
  async getFaq() {
    return this.reportService.getFaq();
  }
}