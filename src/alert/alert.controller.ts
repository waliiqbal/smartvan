/* eslint-disable prettier/prettier */
import { 
  Body, 
  Controller, 
  Post, 
  Req, 
  Get,
  BadRequestException,
  Query,
  Param

  

} from '@nestjs/common';


import { alertService } from './alert.service';
import { AddAlertDto } from './dto/addAlertdto';
import { AuthGuard } from '@nestjs/passport';
import { UseGuards } from '@nestjs/common';

@Controller('alert')
export class AlertController {
  constructor(private readonly AlertService: alertService) {}


  @UseGuards(AuthGuard('jwt'))
  @Post('addAlert')
  async addAlert(@Body() addAlertDto: AddAlertDto, @Req() req: any) {
    const adminId = req.user.userId
    return this.AlertService.addAlert(addAlertDto, adminId);
  
  }

   @UseGuards(AuthGuard('jwt')) // JWT protection
  @Get('getAlert')
  async getAlert(
    @Req() req: any, // JWT se user info aayega
    @Query('page') page: string,
    @Query('limit') limit: string
  ) {
    // JWT se adminId nikal lo (agar zarurat ho)
    const adminId = req.user.userId;

    if (!adminId) {
      throw new BadRequestException('Admin not found in token');
    }

    // pagination values parse karo
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;

    // service function call with pagination
    return this.AlertService.getAlerts(adminId, pageNumber, limitNumber);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('getAlertById/:alertId')
  async getAlertById(@Param('alertId') alertId: string, @Req() req: any) {
    const adminId = req.user.userId; // JWT se adminId
    return this.AlertService.getAlertById(adminId, alertId);
  }

@UseGuards(AuthGuard('jwt'))
@Post('editAlert')
async editAlert(@Req() req: any, @Body() body: any) {
  const adminId = req.user.userId; // JWT se admin ID
  const { alertId, ...updateData } = body; // body se alertId alag kar liya

  if (!alertId) {
    throw new BadRequestException('alertId is required');
  }

  return this.AlertService.editAlert(adminId, alertId, updateData);
}
@UseGuards(AuthGuard('jwt'))
@Post('deleteAlert')
async deleteAlert(@Req() req: any, @Body('alertId') alertId: string) {
  const adminId = req.user.userId; 
  return this.AlertService.deleteAlert(adminId, alertId);
}

}



