import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSettingDto } from './dto/create-setting.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Setting } from './entities/setting.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private readonly settingsRepository: Repository<Setting>,
  ) {}

  /**
   * Creates or updates a setting in the database.
   * @param createSettingDto - The DTO containing the setting data to be created or updated.
   * @returns A promise that resolves to the created or updated setting.
   */
  async createOrUpdateSetting(
    createSettingDto: CreateSettingDto,
  ): Promise<Setting> {
    const existingSetting = await this.settingsRepository.findOne({
      where: { id: 1 },
    });

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
    const setting = await this.settingsRepository.findOne({
      where: { id: 1 },
    });
    if (!setting) {
      throw new NotFoundException('Setting not found');
    }
    return setting;
  }
}
