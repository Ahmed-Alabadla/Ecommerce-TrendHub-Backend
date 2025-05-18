import { Injectable, BadRequestException } from '@nestjs/common';
import {
  v2 as cloudinary,
  UploadApiErrorResponse,
  UploadApiResponse,
} from 'cloudinary';

@Injectable()
export class CloudinaryService {
  /**
   * Upload single or multiple images to Cloudinary
   * @param files Single file or array of files
   * @param folder Destination folder in Cloudinary
   * @returns Promise with single URL or array of URLs
   */
  async uploadImages(
    files: Express.Multer.File | Express.Multer.File[],
    folder = 'ecommerce',
  ): Promise<string | string[]> {
    if (Array.isArray(files)) {
      return this.uploadMultipleImages(files, folder);
    }
    return this.uploadSingleImage(files, folder);
  }

  /**
   * Upload a single image to Cloudinary
   */
  private async uploadSingleImage(
    file: Express.Multer.File,
    folder: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder,
        },
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error) {
            reject(
              new BadRequestException(
                `Cloudinary upload error: ${error.message}`,
              ),
            );
            return;
          }
          if (!result) {
            reject(
              new BadRequestException('Cloudinary upload returned no result'),
            );
            return;
          }
          resolve(result.secure_url);
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  /**
   * Upload multiple images to Cloudinary
   */
  private async uploadMultipleImages(
    files: Express.Multer.File[],
    folder: string,
  ): Promise<string[]> {
    try {
      const uploadPromises = files.map((file) =>
        this.uploadSingleImage(file, folder),
      );
      return await Promise.all(uploadPromises);
    } catch (error) {
      throw new BadRequestException(
        `Failed to upload images: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Delete single or multiple images from Cloudinary
   */
  async deleteImages(publicIds: string | string[]): Promise<void> {
    try {
      const ids = Array.isArray(publicIds) ? publicIds : [publicIds];
      const deletePromises = ids.map((publicId) =>
        cloudinary.uploader.destroy(publicId),
      );
      await Promise.all(deletePromises);
    } catch (error) {
      throw new BadRequestException(
        `Failed to delete images: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
