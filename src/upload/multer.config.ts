/* eslint-disable prettier/prettier */
// uploads/multer.config.ts
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { configureCloudinary } from './cloudinary.config';
import { ConfigService } from '@nestjs/config';
import * as path from 'path'; // ✅ Correct import


export const createMulterOptions = (configService: ConfigService) => {
  configureCloudinary(configService);

  const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      const originalNameWithoutExt = path.parse(file.originalname).name;

      return {
        folder: 'uploads',
        resource_type: 'auto',   // ✅ IMPORTANT — allows images, audio, video
        allowed_formats: [
          'jpg', 'jpeg', 'png',  // images
          'mp4', 'mov', 'mkv',   // videos
          'mp3', 'wav', 'm4a'    // audio/voice
        ],
        public_id: originalNameWithoutExt,
      };
    },
  });

  return { storage };
};

