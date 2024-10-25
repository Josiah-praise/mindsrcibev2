import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from 'src/services/prisma.service';
import { EncryptionService } from 'src/services/encryption.service';
import { User } from 'src/entities/user';
import { Prisma } from '@prisma/client';
import { FileUploadService } from 'src/services/fileUpload.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly fileUploadService: FileUploadService,
    private readonly encryptionService: EncryptionService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, username, password } = createUserDto;

    // Check if email or username already exists
    const existingUser = await this.prismaService.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    // generate appropriate error message if the user exists
    if (existingUser) {
      if (existingUser.email === email && existingUser.username === username) {
        throw new ConflictException(
          'Email and username already associated with an account',
        );
      } else if (existingUser.email === email) {
        throw new ConflictException('Email already associated with an account');
      } else {
        throw new ConflictException('Username already exists');
      }
    }

    // Hash password
    const hashedPassword = await this.encryptionService.hashPassword(password);

    // Create new user
    return await this.prismaService.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
    });
  }

  async updateUser(userId: string, updateUserDto: UpdateUserDto) {
    try {
      const user = await this.prismaService.user.update({
        where: {
          id: userId,
        },
        data: {
          ...updateUserDto,
        },
      });
      delete user.password;
      return user;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      )
        throw new NotFoundException("User record doesn't exist");
      throw error;
    }
  }

  async getUserById(userId) {
    try {
      const user = await this.prismaService.user.findUnique({
        where: {
          id: userId,
        },
      });
      delete user.password;
      return user;
    } catch (error) {
      throw new InternalServerErrorException({
        message: error.message,
        error: error.code,
      });
    }
  }

  async findAll(page: number = 1, limit: number = 15) {
    const total = await this.prismaService.user.count();

    if (!total)
      return {
        data: [],
        meta: {
          total: 0,
          page: 0,
          currPageTotal: 0,
          limit,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

    if (page < 1) page = 1;
    if (limit < 1) limit = 15;

    const totalPages = Math.ceil(total / limit);
    page = page > totalPages ? totalPages : page;
    const skip = (page - 1) * limit;

    const users = await this.prismaService.user.findMany({
      skip,
      take: limit,
      orderBy: {
        username: 'asc',
      },
    });

    users.forEach((user) => delete user.password);

    return {
      data: users,
      meta: {
        total,
        page,
        currPageTotal: users.length,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prismaService.user.findUnique({
      // get user with email
      where: {
        email,
      },
    });

    return user ? user : null;
  }

  async findOne(id: string): Promise<User | null> {
    const user = await this.prismaService.user.findUnique({
      // get user by id
      where: {
        id,
      },
    });

    return user ? user : null;
  }

  async deleteUserById(userId) {
    try {
      await this.prismaService.user.delete({ where: { id: userId } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      )
        throw new NotFoundException("Post doesn't exist");
      throw error;
    }
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    return { url: await this.fileUploadService.uploadFile(file, userId) };
  }
}
