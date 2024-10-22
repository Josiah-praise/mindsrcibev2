import { ApiProperty } from '@nestjs/swagger';
import { CreatePostResponseDto } from './postResponse.dto';

class Count {
  @ApiProperty()
  comments: number;
  @ApiProperty()
  likes: number;
}

class Author {
  @ApiProperty()
  id: string;
  @ApiProperty()
  avatarUrl: string;
  @ApiProperty()
  username: string;
  @ApiProperty()
  firstname: string;
  @ApiProperty()
  lastname: string;
}

export class GetPostsResponseDto extends CreatePostResponseDto {
  @ApiProperty()
  author: Author;
  @ApiProperty()
  _count: Count;
}

export class PaginatedPostResponse {
  @ApiProperty({
    description: 'An array of posts',
    type: GetPostsResponseDto,
    isArray: true,
  })
  data: GetPostsResponseDto[];
  @ApiProperty({
    description: 'metadata for pagination',
    example: {
      total: 1000,
      page: 10,
      limit: 10,
      currPageTotal: 10,
      totalPages: 100,
      hasNextPage: true,
      hasPreviousPage: true,
    },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    currPageTotal: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
