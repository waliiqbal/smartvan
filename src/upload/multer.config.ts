// /* eslint-disable prettier/prettier */
// // uploads/multer.config.ts
// import { v2 as cloudinary } from 'cloudinary';
// import { CloudinaryStorage } from 'multer-storage-cloudinary';
// import { configureCloudinary } from './cloudinary.config';
// import { ConfigService } from '@nestjs/config';
// import * as path from 'path'; // ✅ Correct import


// export const createMulterOptions = (configService: ConfigService) => {
//   configureCloudinary(configService);

//   const storage = new CloudinaryStorage({
//     cloudinary,
//     params: async (req, file) => {
//       const originalNameWithoutExt = path.parse(file.originalname).name;

//       return {
//         folder: 'uploads',
//         resource_type: 'auto',   // ✅ IMPORTANT — allows images, audio, video
//         allowed_formats: [
//           'jpg', 'jpeg', 'png',  // images
//           'mp4', 'mov', 'mkv',   // videos
//           'mp3', 'wav', 'm4a'    // audio/voice
//         ],
//         public_id: originalNameWithoutExt,
//       };
//     },
//   });

//   return { storage };
// };


import { S3Client } from '@aws-sdk/client-s3';
import * as multer from 'multer';
import * as multerS3 from 'multer-s3';
import { ConfigService } from '@nestjs/config';

export const createMulterOptions = (configService: ConfigService) => {
  const s3 = new S3Client({
    region: configService.get<string>('AWS_REGION'),
    credentials: {
      accessKeyId: configService.get<string>('AWS_ACCESS_KEY_ID'),
      secretAccessKey: configService.get<string>('AWS_SECRET_ACCESS_KEY'),
    },
    endpoint: configService.get<string>('AWS_S3_ENDPOINT'), 
  });

  const storage = multerS3({
    s3,
    bucket: configService.get<string>('AWS_BUCKET_NAME'),
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const timestamp = Date.now().toString();
      const originalName = file.originalname.replace(/\s+/g, '_'); // remove spaces
      cb(null, `${timestamp}_${originalName}`);
    },
  });

  return { storage };
};
