import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  BadRequestException,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { AuthRolesGuard } from '../users/guards/auth-roles.guard';
import { UserType } from '../utils/enums';
import { Roles } from '../users/decorators/user-role.decorator';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * @method POST
   * @route ~/api/settings
   * @access Private [Admin]
   */
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN)
  @UseInterceptors(
    FileInterceptor('store_logo', {
      limits: {
        fileSize: 2 * 1024 * 1024, // 2MB
      },
      fileFilter: (req, file, cb) => {
        const validTypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'image/jpg',
        ];
        if (validTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(`Invalid file type: ${file.mimetype}`),
            false,
          );
        }
      },
    }),
  )
  @Post()
  create(
    @Body() createSettingDto: CreateSettingDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
      }),
    )
    file?: Express.Multer.File,
  ) {
    return this.settingsService.createOrUpdateSetting(createSettingDto, file);
  }

  /**
   * @method GET
   * @route ~/api/settings
   * @access Private [Admin]
   */
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN)
  @Get()
  findSettings() {
    return this.settingsService.getSettings();
  }
}
