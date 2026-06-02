import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

@Injectable()
export class UploadService {
  private readonly ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
  private readonly MAX_SIZE = 5 * 1024 * 1024; // 5MB

  private validateFile(file: Express.Multer.File) {
    if (!this.ALLOWED_MIMES.includes(file.mimetype)) {
      throw new BadRequestException('Faqat JPEG, PNG, WEBP formatdagi rasmlar qabul qilinadi');
    }
    if (file.size > this.MAX_SIZE) {
      throw new BadRequestException('Rasm hajmi 5MB dan oshmasligi kerak');
    }
  }

  private uploadStream(file: Express.Multer.File, folder: string): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image' },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve({ url: result.secure_url, publicId: result.public_id });
        },
      );
      streamifier.createReadStream(file.buffer).pipe(stream);
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<{ url: string; publicId: string }> {
    this.validateFile(file);
    return this.uploadStream(file, 'avtoehtiyot/requests');
  }

  async uploadImages(files: Express.Multer.File[]): Promise<Array<{ url: string; publicId: string }>> {
    if (files.length > 5) {
      throw new BadRequestException('Maksimal 5 ta rasm yuklanishi mumkin');
    }
    return Promise.all(files.map((file) => this.uploadImage(file)));
  }

  async deleteImage(publicId: string): Promise<{ message: string }> {
    await cloudinary.uploader.destroy(publicId);
    return { message: 'Rasm muvaffaqiyatli o\'chirildi' };
  }
}
