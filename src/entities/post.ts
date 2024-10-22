import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from 'src/users/dto/userResponse.dto';

export class Post {
  @ApiProperty()
  id: string;
  @ApiProperty()
  author: UserResponseDto;
  @ApiProperty()
  authorId: string;
  @ApiProperty()
  title: string;
  @ApiProperty()
  content: string;
  @ApiProperty({
    description: 'When true, makes an article visible and otherwise',
  })
  published: boolean;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  updatedAt: Date;
  @ApiProperty({ description: 'the time taken to read a post in seconds' })
  readTime: number;
}
