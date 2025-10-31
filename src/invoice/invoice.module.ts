/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';




@Module({
 
  controllers: [InvoiceController],
  providers: [InvoiceService], 
  exports: [InvoiceService], 

})
// eslint-disable-next-line prettier/prettier
export class InvoiceModule {}