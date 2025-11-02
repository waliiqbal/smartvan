/* eslint-disable prettier/prettier */
import { Body, Controller, Post, Get,  Req, Query,Param, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { AuthGuard } from '@nestjs/passport';
import { UseGuards } from '@nestjs/common';
import { CreateInvoiceDto } from './dto/createInvoice.dto';

@Controller('Invoice')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('createInvoice')
  async createInvoice(
    @Body() CreateInvoiceDto: CreateInvoiceDto,
    @Req() req: any
    
  ) {
     if (req.user.role !== 'superadmin') {
         throw new UnauthorizedException('Only superadmins can access this API');
       }
    return this.invoiceService.createInvoice(CreateInvoiceDto);
  }

  @UseGuards(AuthGuard('jwt'))
@Get('getAllInvoicesBySuperAdmin')
async getAllInvoicesBySuperAdmin(
  @Req() req: any,
  @Query('page') page: string,
  @Query('limit') limit: string,
  @Query('search') search?: string
) {
  // 1️⃣ JWT user check
  if (!req.user || req.user.role !== 'superadmin') {
    throw new UnauthorizedException('Only superadmins can access this API');
  }

  // 2️⃣ Pagination convert
  const pageNumber = page ? parseInt(page) : 1;
  const limitNumber = limit ? parseInt(limit) : 10;

  // 3️⃣ Service call
  return this.invoiceService.getAllInvoicesBySuperAdmin(pageNumber, limitNumber, search);
}

@UseGuards(AuthGuard('jwt'))
@Post('editInvoice')
async editInvoice(
  @Body() body: any, // body me invoiceId + dto fields dono aayenge
  @Req() req: any
) {
  // 1️⃣ Only superadmin can edit
  if (req.user.role !== 'superadmin') {
    throw new UnauthorizedException('Only superadmins can access this API');
  }

  // 2️⃣ invoiceId body me hona chahiye
  const { invoiceId, ...updateData } = body;

  if (!invoiceId) {
    throw new BadRequestException('Invoice ID is required');
  }


  return this.invoiceService.editInvoice(invoiceId, updateData);
}

@UseGuards(AuthGuard('jwt'))
@Get('getInvoiceById/:invoiceId')
async getInvoiceById(
  @Param('invoiceId') invoiceId: string,
  @Req() req: any
) {
  // 1️⃣ Only superadmin can access
  if (!req.user || req.user.role !== 'superadmin') {
    throw new UnauthorizedException('Only superadmins can access this API');
  }

  // 2️⃣ invoiceId check
  if (!invoiceId) {
    throw new BadRequestException('Invoice ID is required');
  }

 
  return this.invoiceService.getInvoiceById(invoiceId);
}


  }