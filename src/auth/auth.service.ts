import { Injectable } from '@nestjs/common';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UsersService } from 'src/users/users.service';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from 'src/services/encryption.service';
import { User } from 'src/entities/user';

@Injectable()
export class AuthService {
  constructor(
    private readonly encryptionService: EncryptionService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async createAccount(createUserDto: CreateUserDto): Promise<User> {
    return await this.usersService.create(createUserDto);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    // check if a user with this email exists
    const user = await this.usersService.findByEmail(email);

    // check if passwords match
    return user &&
      (await this.encryptionService.checkPassword(password, user.password))
      ? user
      : null;
  }
}
