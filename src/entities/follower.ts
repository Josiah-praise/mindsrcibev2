import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from 'src/users/dto/userResponse.dto';

export class Follower {
  @ApiProperty()
  id: string;
  @ApiProperty()
  user: UserResponseDto;
  @ApiProperty()
  userId: string;
  @ApiProperty()
  following: UserResponseDto;
  @ApiProperty()
  followingId: string;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  updatedAt: Date;
}
