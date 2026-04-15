/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { RouteService } from './route.service';
import { routeController } from './route.controller';

@Module({
  
  controllers: [routeController],
  providers: [RouteService],
  exports: [RouteService] 
})
export class RouteModule {}