import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly redis;
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    const redisUrl: string = configService.get('REDIS_URL');

    this.redis = new Redis(redisUrl);
  }

  async isValidToken(token: string): Promise<boolean> {
    // the token is valid if it's not in redis
    // only invalidated tokens should be cached
    return (await this.redis.get(token)) === null;
  }

  async invalidateToken(userId: string, token: string): Promise<any> {
    const ttl = await this.calculateTtl(token);
    return await this.redis.set(token, userId, 'EX', ttl);
  }

  async calculateTtl(token: string): Promise<number> {
    const ttl =
      (await this.jwtService.decode(token).exp) - Math.floor(Date.now() / 1000);
    return ttl;
  }
}
