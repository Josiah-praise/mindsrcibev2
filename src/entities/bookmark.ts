import { ApiProperty } from '@nestjs/swagger';
import { Post } from './post';
import { UserResponseDto } from 'src/users/dto/userResponse.dto';

export class Bookmark {
  @ApiProperty()
  id: string;
  @ApiProperty()
  user: UserResponseDto;
  @ApiProperty()
  userId: string;
  @ApiProperty()
  post: Post;
  @ApiProperty()
  postId: string;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  updatedAt: Date;
}
