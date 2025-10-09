/* eslint-disable prettier/prettier */
import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import * as schema from './schema';
import { DatabaseService } from './databaseservice'

@Global()
@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGODB_URI),
    MongooseModule.forFeature([
       { name: 'Parent', schema: schema.UserSchema, collection: 'parents' },
       { name: 'Driver', schema: schema.UserSchema, collection: 'drivers' },
       { name: schema.Admin.name, schema: schema.AdminSchema },
        { name: schema.School.name, schema: schema.SchoolSchema },
       { name: schema.Van.name, schema: schema.VanSchema },
       { name: schema.Kid.name, schema: schema.KidSchema },
        { name: schema.Trip.name, schema: schema.TripSchema },
         { name: schema.Notification.name, schema: schema.NotificationSchema },
          { name: schema.Report.name, schema: schema.ReportSchema },
           { name: schema.FAQ.name, schema: schema.FAQSchema },
           { name: schema.Route.name, schema: schema.RouteSchema },
    ]),
  ],
  exports: [MongooseModule, DatabaseService],
  providers: [DatabaseService],
})
export class DatabaseModule {}