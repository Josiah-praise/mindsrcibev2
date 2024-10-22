import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { PaginationMetaDataDto } from 'src/users/dto/userResponse.dto';

export class CreateCommentDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'comment content',
    example: 'asddfgff',
    type: String,
  })
  comment: string;
}

export class CommentResponseDto {
  @ApiProperty()
  userId: string;
  @ApiProperty()
  postId: string;
  @ApiProperty()
  comment: string;
  @ApiProperty()
  parentId: string | null;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedCommentsDto {
  @ApiProperty({
    type: CommentResponseDto,
    isArray: true,
  })
  data: CommentResponseDto[];
  @ApiProperty()
  meta: PaginationMetaDataDto;
}
