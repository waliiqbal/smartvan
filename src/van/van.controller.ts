/* eslint-disable prettier/prettier */
import { Body, Controller, Post, Req,Get, Patch, Query, BadRequestException, Param,  } from '@nestjs/common';
import { VanService } from './van.service';
import { AuthGuard } from '@nestjs/passport';
import { UseGuards } from '@nestjs/common';
import { CreateVanDto } from './dto/create-van.dto';
import { CreateVanByAdminDto } from './dto/createVanByAdmin.dto';
import { EditVanByAdminDto } from './dto/editVanByAdmin.dto';
import { EditDriverDto } from './dto/editDriver.dto';




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
@Get('getKidsByDriver')
async GetKidsByDriver(
  @Req() req: any,
  @Query('tripId') tripId: string,
   @Query('page') page: string,
    @Query('limit') limit: string,  
) {
  const  userId   = req.user.userId;
   const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
  return this.vanService.getDriverKids(userId, tripId, pageNumber, limitNumber );
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

    @Get("getVanById/:id")
  async getVan(@Param("id") id: string) {
    console.log(id)
    return this.vanService.getVanById(id);
  }
@UseGuards(AuthGuard('jwt'))
@Post('update-profile')
async updateProfile(
  @Req() req: any,
  @Body() editDto: EditDriverDto,   
) {
  const userId = req.user.userId;       
  const userType = req.user.userType;   

  return this.vanService.updateProfile(userId, userType, editDto);
}

@UseGuards(AuthGuard('jwt'))
@Post('update-van')
async updateVan(
  @Req() req: any,
  @Body() body: any,
) {
  const driverId = req.user.userId;
  const { vanId, ...createVanDto } = body; // 👈 ab flat body handle ho jaayega

  return this.vanService.updateVan(driverId, vanId, createVanDto);
}

@UseGuards(AuthGuard('jwt')) // ye guard token verify karega
  @Post('uploadDocuments')
  async updateVanDocuments(@Body() body: any, @Req() req: any) {
   
    const driverId = req.user?.id; 

    return this.vanService.uploadDocument(body, driverId);
  }

@UseGuards(AuthGuard('jwt'))
@Get('getDriverDocuments')
async getDriverDocuments(@Req() req: any) {
  const driverId = req.user.userId;
  return this.vanService.getDriverDocuments(driverId);
}

@UseGuards(AuthGuard('jwt'))
@Get('getVehicleType')
async getVehicleType(@Req() req: any) {
  const driverId = req.user.userId;

  if (!driverId) {
    throw new BadRequestException('Invalid driver token');
  }

  // ✅ Static vehicle types
  const vehicleTypes = ['Mehran', 'Cultus', 'Corolla' , 'Alto', "wagonR"];

  return {
    message: 'Vehicle types fetched successfully',
    data: vehicleTypes,
  };
}


@UseGuards(AuthGuard('jwt'))
@Post('deleteVanByDriver')
async deleteVanByDriver(@Req() req: any) {
  const driverId = req.user.userId;
  return this.vanService.deleteVan(driverId);
}
}


