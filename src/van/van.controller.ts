/* eslint-disable prettier/prettier */
import { Body, Controller, Post, Req,Get, Patch, Query, BadRequestException } from '@nestjs/common';
import { VanService } from './van.service';
import { AuthGuard } from '@nestjs/passport';
import { UseGuards } from '@nestjs/common';
import { CreateVanDto } from './dto/create-van.dto';
import { CreateVanByAdminDto } from './dto/createVanByAdmin.dto';
import { EditVanByAdminDto } from './dto/editVanByAdmin.dto';




@Controller('van')
export class VanController {
  constructor(private readonly vanService: VanService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('addVan')
  async addVan(
    @Body() createVanDto: CreateVanDto,
    @Req() req: any
  ) {
    const { userId, userType } = req.user; // 👈 user info from JWT
    return this.vanService.addVan(createVanDto, userId, userType);
  }

  @UseGuards(AuthGuard('jwt'))
@Get('getVans')
async getVans(@Req() req: any) {
  const { userId, userType } = req.user;
  return this.vanService.getVans(userId, userType);
}

@UseGuards(AuthGuard('jwt'))
@Post('addVanByAdmin')
async addVanByAdmin(
  @Body() CreateVanByAdminDto : CreateVanByAdminDto , 
  @Req() req: any,
) {
  const AdminId = req.user.userId;
  return this.vanService.addVanByAdmin(CreateVanByAdminDto , AdminId);
}

@UseGuards(AuthGuard('jwt'))
@Post('editVanByAdmin')
async editVanByAdmin(

@Body() EditVanByAdminDto: EditVanByAdminDto,
  @Req() req: any,
) {
  const AdminId = req.user.userId;
console.log(AdminId)
  return this.vanService.editVanByAdmin(EditVanByAdminDto, AdminId);
}
 @UseGuards(AuthGuard('jwt')) // JWT Auth Guard use
  @Get("GetVansByAdmin")
  async getstudent(
    @Req() req: any, // request object, JWT decoded user info milega
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search?: string,
  ) {
    // JWT token se AdminId nikal lo
    const adminId = req.user.userId; // assuming AuthGuard ne req.user me user data daala

    if (!adminId) {
      throw new BadRequestException ('Admin not found in token');
    }

    // page aur limit ko number me convert karo
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;

    // service call
    return this.vanService.getVansByAdmin(adminId, pageNumber, limitNumber, search);

  
  }

}

