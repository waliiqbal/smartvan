/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { KidService } from './kid.service';
import { KidController } from './kid.controller';




@Module({
 
  controllers: [KidController],
  providers: [KidService], 
  exports: [KidService], 
})
// eslint-disable-next-line prettier/prettier
export class KidModule {}