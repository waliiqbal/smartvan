/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';

import { AlertController } from './alert.controller';
import { alertService } from './alert.service';

@Module({
  
  controllers: [AlertController],
  providers: [alertService],
  exports: [alertService] // agar kahin aur use karna ho to
})
export class AlertModule {}