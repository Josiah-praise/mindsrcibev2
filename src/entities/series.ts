import { ApiProperty } from '@nestjs/swagger';
import { Post } from './post';
import { UserResponseDto } from 'src/users/dto/userResponse.dto';

export class series {
  @ApiProperty()
  id: string;
  @ApiProperty()
  title: string;
  @ApiProperty()
  owner: UserResponseDto;
  @ApiProperty()
  ownerId: string;
  @ApiProperty()
  posts: Post[];
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  updatedAt: Date;
}
