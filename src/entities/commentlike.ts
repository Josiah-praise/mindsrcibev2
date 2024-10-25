import { ApiProperty } from '@nestjs/swagger';
import { Comment } from './comment';
import { UserResponseDto } from 'src/users/dto/userResponse.dto';

export class CommentLike {
  @ApiProperty()
  id: string;
  @ApiProperty()
  user: UserResponseDto;
  @ApiProperty()
  userId: string;
  @ApiProperty()
  isLiked: boolean;
  @ApiProperty()
  comment: Comment;
  @ApiProperty()
  commentId: string;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  updatedAt: Date;
}
