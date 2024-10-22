import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { EmailService } from 'src/services/email.service';
import { UserLoginInfoService } from 'src/services/logininfo.service';

@Module({
  providers: [AuthService, EmailService, UserLoginInfoService],
  controllers: [AuthController],
  imports: [UsersModule],
})
export class AuthModule {}
