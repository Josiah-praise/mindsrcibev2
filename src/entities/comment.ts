import { ApiProperty } from '@nestjs/swagger';
import { Post } from './post';
import { UserResponseDto } from 'src/users/dto/userResponse.dto';

export class Comment {
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
  comment: string;
  @ApiProperty()
  parent?: Comment;
  @ApiProperty()
  parentId?: string;
  @ApiProperty()
  commentReplies?: Comment[];
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  updatedAt: Date;
}
