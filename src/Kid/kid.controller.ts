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

@UseGuards(AuthGuard('jwt'))
@Post('assignVanToStudent')
async assignVanToStudent(
  @Body('kidId') kidId: string,
  @Body('vanId') vanId: string,
  @Req() req: any,
) {
  const adminId = req.user.userId;
  return this.KidService.assignVanToStudent(kidId, vanId, adminId);
}

@UseGuards(AuthGuard('jwt'))
@Post('verifyStudentByAdmin')
async verifyStudentByAdmin(
  @Body('kidId') kidId: string,
  @Req() req: any,
) {
  const adminId = req.user.userId;
  return this.KidService.verifyStudentByAdmin(kidId, adminId);
}

@UseGuards(AuthGuard('jwt'))
@Post('update-kid')
async updateKid(
  @Req() req: any,
  @Body() body: any,
) {
  const parentId = req.user.userId;
  const { kidId, ...CreateKidDto } = body; // 👈 ab flat body handle ho jaayega

  return this.KidService.updateKid(parentId, kidId, CreateKidDto);
}

}

