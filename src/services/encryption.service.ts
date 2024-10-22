import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { hash, compare, genSalt } from 'bcryptjs';

@Injectable()
export class EncryptionService {
  constructor(private readonly configService: ConfigService) {}

  async hashPassword(password: string): Promise<string> {
    try {
      // try hashing the password
      const salt = await genSalt(
        parseInt(this.configService.get('SALT')) || 10,
      );
      const $hash: string = await hash(password, salt);
      return $hash;
    } catch (error) {
      // handle errors if bcrypt fails
      console.error('Password hashing error:', error);
      throw new InternalServerErrorException('Error hashing password');
    }
  }

  async checkPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await compare(password, hash);
    } catch (error) {
      console.error('Password comparison error:', error);
      throw new InternalServerErrorException('Error comparing passwords');
    }
  }
}
