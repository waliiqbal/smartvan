/* eslint-disable prettier/prettier */

import { Controller, Post, Body, Req, Get, Query, Param } from '@nestjs/common';
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

   @UseGuards(AuthGuard('jwt')) // Token guard
  @Get("getComplainsByAdmin")
  async getComplainsByAdmin( 
    @Req() req: any,
    @Query() query: any,
    @Query('page') page: string,
  @Query('limit') limit: string,
) {
    const adminId = req.user.userId;
     const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
    return this.reportService.getReportsForAdmin( adminId, req?.user?.role, query);
  }

  
  @UseGuards(AuthGuard('jwt'))
  @Post('changeComplaintStatus')
async changeComplaintStatus(
  @Req() req: any,
  
  @Body() body: { reportId: string; status: string, adminRemarks?: string },
) {
  const adminId = req.user.userId; // JWT token se adminId milti hai
  const { reportId, status, adminRemarks } = body;

  


  return this.reportService.changeComplaintStatus(adminId, reportId, status, adminRemarks);
  
}

@UseGuards(AuthGuard('jwt'))
@Get('getComplaintById/:reportId')
async getComplaintById(
  @Req() req: any,
  @Param('reportId') reportId: string,
) {
  const adminId = req.user.userId; // JWT se adminId

  return this.reportService.getComplaintById(adminId, reportId);
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