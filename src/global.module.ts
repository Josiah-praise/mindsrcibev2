import { Global, Module } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';
import { PassportJwtStrategy } from './auth/jwt.strategy';
import { UsersService } from './users/users.service';
import { RedisService } from './services/redis.service';
import { EncryptionService } from './services/encryption.service';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth/auth.service';
import { PassportLocalStrategy } from './auth/local.strategy';
import { JwtGuard } from './auth/jwt.guard';
import { OptionalJwtGuard } from './auth/optionaljwt.strategy';
import { FileUploadService } from './services/fileUpload.service';

@Global()
@Module({
  providers: [
    PrismaService,
    PassportJwtStrategy,
    UsersService,
    RedisService,
    EncryptionService,
    AuthService,
    PassportLocalStrategy,
    JwtGuard,
    OptionalJwtGuard,
    FileUploadService,
  ],
  exports: [
    PrismaService,
    PassportJwtStrategy,
    EncryptionService,
    UsersService,
    RedisService,
    AuthService,
    JwtModule,
    PassportLocalStrategy,
    JwtGuard,
    OptionalJwtGuard,
    FileUploadService,
  ],

  imports: [JwtModule.register({ secret: '*****' })],
})
export class GlobalModule {}
