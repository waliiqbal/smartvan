/* eslint-disable prettier/prettier */
import { BadGatewayException, Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from "src/database/databaseservice";
import { CreateInvoiceDto } from './dto/createInvoice.dto';
import { Types } from 'mongoose';
import mongoose from 'mongoose';






@Injectable()
export class InvoiceService { 
  constructor(
   
    private databaseService: DatabaseService,


   
  ) {}

  async createInvoice(createInvoiceDto: CreateInvoiceDto) {
     const invoice = new this.databaseService.repositories.invoiceModel(createInvoiceDto);
  await invoice.save();
    return {
      message: 'Invoice created successfully',
      data: invoice,
    };
    }

    async getAllInvoicesBySuperAdmin(page = 1, limit = 10, search?: string) {
  const skip = (page - 1) * limit;

  // 1️⃣ Filter for search (optional)
  const filter: any = {};
  if (search) {
    filter.invoiceNumber = { $regex: search, $options: 'i' }; // invoiceNumber ke base pe search
  }

  // 2️⃣ Total count
  const total = await this.databaseService.repositories.invoiceModel.countDocuments(filter);

  // 3️⃣ Fetch invoices with pagination
  const invoices = await this.databaseService.repositories.invoiceModel
    .find(filter)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 }); // latest invoices first

  // 4️⃣ Response
  return {
    message: 'Invoices fetched successfully',
    data: invoices,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async getInvoiceById(invoiceId: string) {
  // 1️⃣ Fetch invoice
  const invoice = await this.databaseService.repositories.invoiceModel
    .findById(invoiceId)
    .populate('schoolId', 'schoolName contactPerson contactNumber'); // optional: school info

  // 2️⃣ Check if found
  if (!invoice) {
    throw new NotFoundException('Invoice not found');
  }

  // 3️⃣ Return response
  return {
    message: 'Invoice fetched successfully',
    data: invoice,
  };
}


async editInvoice(invoiceId: string, updateData: CreateInvoiceDto) {
  // 1️⃣ Check if invoice exists
  const existingInvoice = await this.databaseService.repositories.invoiceModel.findById(invoiceId);

  if (!existingInvoice) {
    throw new NotFoundException('Invoice not found');
  }

  // 2️⃣ Update the invoice
  const updatedInvoice = await this.databaseService.repositories.invoiceModel.findByIdAndUpdate(
    invoiceId,
    { $set: updateData },
    { new: true } // return updated document
  );

  // 3️⃣ Response
  return {
    message: 'Invoice updated successfully',
    data: updatedInvoice,
  };
}


  }