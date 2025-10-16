/* eslint-disable prettier/prettier */
import { 
  Body, 
  Controller, 
  Post, 
  Req, 

  

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
}


