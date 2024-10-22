import { PartialType, OmitType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUrl } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password', 'email'] as const),
) {
  @ApiPropertyOptional({
    example: 'https://storage.com/avatar.png',
  })
  @IsOptional()
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: false,
  })
  avatarUrl?: string;

  @ApiPropertyOptional({
    example: 'https://x.com/xyz',
    description: `Host whitelist: x.com and twitter.com
    Protocols allowed and required:  ['https', 'http']
    `,
  })
  @IsOptional()
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: false,
    host_whitelist: ['x.com', 'twitter.com'], // if you want to restrict to specific domains
  })
  xLink?: string;

  @ApiPropertyOptional({
    example: 'https://youtube.com/xyz',
    description: `Host whitelist: youtube.com and youtu.be
    Protocols allowed and required:  ['https', 'http']
    `,
  })
  @IsOptional()
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
    host_whitelist: ['youtube.com', 'youtu.be'],
  })
  youtubeLink?: string;

  @ApiPropertyOptional({
    example: 'https://facebook.com/xyz',
    description: `Host whitelist: facebook.com
    Protocols allowed and required:  ['https', 'http']
    `,
  })
  @IsOptional()
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
    host_whitelist: ['facebook.com'],
  })
  facebookLink?: string;

  @ApiPropertyOptional({
    example: 'https://instagram.com/xyz',
    description: `Host whitelist: instagram.com
    Protocols allowed and required:  ['https', 'http']
    `,
  })
  @IsOptional()
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
    host_whitelist: ['instagram.com'],
  })
  instagramLink?: string;

  @ApiPropertyOptional({
    example: 'https://twitch.tv/xyz',
    description: `Host whitelist: twitch.tv
    Protocols allowed and required:  ['https', 'http']
    `,
  })
  @IsOptional()
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
    host_whitelist: ['twitch.tv'],
  })
  twitchLink?: string;
}
