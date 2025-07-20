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
       { name: schema.Store.name, schema: schema.StoreSchema },
       { name: schema.Van.name, schema: schema.VanSchema },
       { name: schema.Kid.name, schema: schema.KidSchema },
    ]),
  ],
  exports: [MongooseModule, DatabaseService],
  providers: [DatabaseService],
})
export class DatabaseModule {}