import { ApiProperty } from '@nestjs/swagger';

export class User {
  @ApiProperty()
  id: string;
  @ApiProperty()
  username: string;
  @ApiProperty()
  lastname: string;
  @ApiProperty()
  firstname: string;
  @ApiProperty()
  email: string;
  @ApiProperty()
  password: string;
  @ApiProperty()
  avatarUrl?: string;
  @ApiProperty()
  xLink?: string;
  @ApiProperty()
  youtubeLink?: string;
  @ApiProperty()
  facebookLink?: string;
  @ApiProperty()
  instagramLink?: string;
  @ApiProperty()
  twitchLink?: string;
  @ApiProperty()
  isValid: boolean;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  updatedAt: Date;
}
