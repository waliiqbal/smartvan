/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { DatabaseModule } from './database/database.module';
import { UsersModule } from './user/user.module';
import { AdminModule } from './admin/admin.module'

import { AuthModule } from './auth/auth.module';
import { VanModule } from './van/van.module';
import { KidModule } from './Kid/kid.module';
import {UploadModule} from "./upload/upload.module"
import {SchholModule} from "./school/school.module"


@Module({
  imports: [
    // ✅ Load .env globally
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    AdminModule,
    VanModule,
    KidModule,
    UploadModule,
    SchholModule,

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
