/* eslint-disable prettier/prettier */
import { Body, Controller, Post, Get,  Req, Query } from '@nestjs/common';
import { KidService } from './kid.service'
import { AuthGuard } from '@nestjs/passport';
import { UseGuards } from '@nestjs/common';
import { CreateKidDto } from './dto/CreateKid.dto';




@Controller('kid')
export class KidController {
  constructor(private readonly KidService: KidService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('addKid')
  async addVan(
    @Body() CreateKidDto: CreateKidDto,
    @Req() req: any
  ) {
    const { userId, userType } = req.user; // 👈 user info from JWT
    return this.KidService.addKid(CreateKidDto, userId, userType);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('getKids')
async getKids(@Req() req: any) {
  const { userId, userType } = req.user; // 👈 token se extract hua
  return this.KidService.getKids(userId, userType);
}

}

