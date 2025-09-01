/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';



async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  

  app.use(cookieParser());

  const whitelist = [
    'http://localhost:3000',
    'https://smartvanride.com',
  ];

  app.enableCors({
    origin: (origin, cb) => {
      // allow REST clients / curl with no Origin
      if (!origin) return cb(null, true);
      if (whitelist.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'), false);
    },
    credentials: true, // << required if withCredentials on client
    methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization','X-Requested-With','Accept','Origin'],
    exposedHeaders: ['Content-Length','X-Request-Id'],
  });

  await app.listen(3002, '0.0.0.0');
  console.log('Server running on http://localhost:3002');
}
bootstrap();
