import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { AuthRolesGuard } from 'src/users/guards/auth-roles.guard';
import { UserType } from 'src/utils/enums';
import { Roles } from 'src/users/decorators/user-role.decorator';
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
  @UseInterceptors(FileInterceptor('store_logo'))
  @Post()
  create(
    @Body() createSettingDto: CreateSettingDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 2 }), // 2MB
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|gif|webp)$/ }), // More specific
        ],
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
