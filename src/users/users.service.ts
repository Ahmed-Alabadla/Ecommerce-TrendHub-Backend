import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { ILike, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserType } from 'src/utils/enums';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Creates a new user in the database.
   * @param createUserDto  data for creating a new user
   * @param file optional image file for the user
   * @returns created user
   */
  async create(createUserDto: CreateUserDto, file?: Express.Multer.File) {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new BadRequestException('Email already exists!');
    }
    // Hash the password before saving
    createUserDto.password = await this.hashPassword(createUserDto.password);

    if (file) {
      try {
        const uploadResponse = await this.cloudinaryService.uploadImages(file);
        createUserDto.avatar = Array.isArray(uploadResponse)
          ? uploadResponse[0]
          : uploadResponse;
      } catch (error) {
        throw new BadRequestException(
          `Failed to upload avatar: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    const user = this.usersRepository.create(createUserDto);
    return await this.usersRepository.save(user);
  }

  /**
   * Finds all users in the database.
   * @returns list of users
   */
  async findAll(
    name?: string,
    email?: string,
    role?: UserType,
    page: string = '1',
    limit: string = '5',
  ) {
    // Convert page string to number and throw BadRequestException if parasIntPage isNAN
    const parasIntPage = parseInt(page);
    if (isNaN(parasIntPage) || parasIntPage < 1)
      throw new BadRequestException('Page must be a positive number');

    // Convert limit string to number and throw BadRequestException if parasIntLimit isNAN
    const parasIntLimit = parseInt(limit);
    if (isNaN(parasIntLimit) || parasIntLimit < 1)
      throw new BadRequestException('Limit must be a positive number');

    // Check if limit exceeds 100
    if (parasIntLimit > 100)
      throw new BadRequestException('Limit cannot exceed 100');

    // Calculate skip
    const skip = (parasIntPage - 1) * parasIntLimit;

    // Filters data by name or email or role
    const filters = {
      ...(name ? { name: ILike(`%${name}%`) } : {}),
      ...(email ? { email: ILike(`%${email}%`) } : {}),
      ...(role ? { role: role.toLowerCase() as UserType } : {}),
    };

    const users = await this.usersRepository.find({
      where: filters,
      skip,
      take: parasIntLimit,
      order: { createdAt: 'DESC' },
    });
    const totalFilteredUsers = await this.usersRepository.count({
      where: filters,
    }); // Count WITH filters

    const lastPage =
      Math.ceil(totalFilteredUsers / parasIntLimit) === 0
        ? 1
        : Math.ceil(totalFilteredUsers / parasIntLimit);

    return {
      data: users,

      meta: {
        current_page: parasIntPage,
        per_page: parasIntLimit,
        total: totalFilteredUsers,
        last_page: lastPage,
      },
    };
  }

  /**
   * Finds a user by ID in the database.
   * @param id  user ID
   * @returns  user with the specified ID
   */
  async findOne(id: number) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  /**
   * Updates a user by ID in the database.
   * @param id  user ID
   * @param updateUserDto  data for updating the user
   * @param file optional image file for the user
   * @returns updated user
   */
  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    file?: Express.Multer.File,
  ) {
    const user = await this.findOne(id);

    // Check if the user is active
    if (user.isActive === false) {
      throw new BadRequestException('User is not active!');
    }

    if (file) {
      if (user.avatar) {
        const publicId = user.avatar.split('/').pop()?.split('.')[0] ?? '';
        await this.cloudinaryService.deleteImages(publicId);
      }
      try {
        const uploadResponse = await this.cloudinaryService.uploadImages(file);
        updateUserDto.avatar = Array.isArray(uploadResponse)
          ? uploadResponse[0]
          : uploadResponse;
      } catch (error) {
        throw new BadRequestException(
          `Failed to upload avatar: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    // Merge new data
    Object.assign(user, updateUserDto);

    // Save the updated user
    return await this.usersRepository.save(user);
  }

  /**
   * Removes a user by ID from the database.
   * @param id  user ID
   * @returns confirmation message
   */
  async remove(id: number) {
    const user = await this.findOne(id);
    user.isActive = false;
    await this.usersRepository.save(user);
    return { message: 'User deleted successfully!' };
  }

  /**
   * Hash password
   * @param password password to hashed
   * @returns hashed password
   */
  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }
}
