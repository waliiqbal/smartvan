/* eslint-disable prettier/prettier */
import { Body, Controller, Post, Req,Get } from '@nestjs/common';
import { VanService } from './van.service';
import { AuthGuard } from '@nestjs/passport';
import { UseGuards } from '@nestjs/common';
import { CreateVanDto } from './dto/create-van.dto';




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
}
