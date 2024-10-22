import { Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { RedisService } from '../services/redis.service';
import { Request } from 'express';
import { UserResponseDto } from 'src/users/dto/userResponse.dto';

type payload = {
  id: string;
  email: string;
  [key: string]: string;
};

@Injectable()
export class PassportJwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: payload): Promise<UserResponseDto> {
    const token = req.headers.authorization.split(' ')[1];

    // check if this token is cached in redis
    if (!(await this.redisService.isValidToken(token)))
      throw new UnauthorizedException();
    const email = payload.email as string;
    const user = await this.usersService.findByEmail(email);
    if (user) {
      delete user.password;
      return user;
    }
    throw new UnauthorizedException();
  }
}
