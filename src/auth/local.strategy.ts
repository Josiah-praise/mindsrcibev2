import { Strategy } from 'passport-local';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UserResponseDto } from 'src/users/dto/userResponse.dto';

@Injectable()
export class PassportLocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email', // Configure to use email instead of username
      passwordField: 'password',
      session: false, // Disable session
    });
  }

  async validate(email: string, password: string): Promise<UserResponseDto> {
    const user = await this.authService.validateUser(email, password);

    if (user) {
      delete user.password;
      return user;
    }

    throw new UnauthorizedException();
  }
}
