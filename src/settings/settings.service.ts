import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSettingDto } from './dto/create-setting.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Setting } from './entities/setting.entity';
import { Repository } from 'typeorm';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private readonly settingsRepository: Repository<Setting>,

    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Creates or updates a setting in the database.
   * @param createSettingDto - The DTO containing the setting data to be created or updated.
   * @param file - The file to be uploaded (optional).
   * @returns A promise that resolves to the created or updated setting.
   */
  async createOrUpdateSetting(
    createSettingDto: CreateSettingDto,
    file?: Express.Multer.File,
  ) {
    const existingSetting = await this.settingsRepository.findOne({
      where: { id: 1 },
    });

    if (file) {
      if (existingSetting?.store_logo) {
        const publicId =
          existingSetting.store_logo.split('/').pop()?.split('.')[0] ?? '';
        await this.cloudinaryService.deleteImages(publicId);
      }
      try {
        const uploadResponse = await this.cloudinaryService.uploadImages(file);
        createSettingDto.store_logo = Array.isArray(uploadResponse)
          ? uploadResponse[0]
          : uploadResponse;
      } catch (error) {
        throw new BadRequestException(
          `Failed to upload image: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    if (existingSetting) {
      // Update the existing setting
      const updatedSetting = Object.assign(existingSetting, createSettingDto);
      return await this.settingsRepository.save(updatedSetting);
    } else {
      // Create a new setting
      const newSetting = this.settingsRepository.create(createSettingDto);
      return this.settingsRepository.save(newSetting);
    }
  }

  /**
   * Retrieves the settings from the database.
   * @returns A promise that resolves to the settings.
   * @throws NotFoundException if the settings are not found.
   */
  async getSettings(): Promise<Setting> {
    const FindSettings = await this.settingsRepository.find();
    const settings = FindSettings[0];
    if (!settings) {
      throw new NotFoundException('Setting not found');
    }
    return settings;
  }
}
