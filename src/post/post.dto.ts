import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsBoolean,
  IsInt,
  IsOptional,
  MinLength,
  MaxLength,
  Min,
  IsUrl,
  IsNumber,
} from 'class-validator';

import { Transform } from 'class-transformer';

export class CreatePostDto {
  @ApiProperty({
    example: 'Why Cats Lie',
    description: 'The title of the post',
  })
  @IsString()
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  @MaxLength(100, { message: 'Title cannot exceed 100 characters' })
  title: string;

  @ApiProperty({
    description: 'Post content',
    example: 'Cats lie for various reasons, including...',
  })
  @IsString()
  @MinLength(10, { message: 'Content must be at least 100 characters long' })
  content: string;

  @ApiPropertyOptional({
    description: 'When true, makes an article visible',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      console.log(value);
      const lowerValue = value.toLowerCase();
      if (lowerValue === 'true') return true;
      if (lowerValue === 'false') return false;
    }
    return value; // Fallback, if it's not a string or doesn't match 'true'/'false'
  })
  published?: boolean;

  @ApiPropertyOptional({
    description: 'The time taken to read a post in minutes',
    example: 3,
    minimum: 1,
    default: 2,
  })
  @IsInt()
  @Min(1, { message: 'Read time must be at least 1 minutes' })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  readTime?: number;

  @ApiPropertyOptional({
    description: 'URL of the banner image for the post',
    default: 'https://mindsrcibe.s3.amazonaws.com/defaultBanner.jpg',
  })
  @IsOptional()
  @IsUrl({
    protocols: ['https'],
    require_protocol: true,
  })
  bannerUrl?: string;

  @ApiPropertyOptional({
    description: 'UUID of the series this post belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  seriesId?: string;
}

export class UpdatePostDto extends PartialType(CreatePostDto) {}
export class CreatePostResponseDto extends CreatePostDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  updatedAt: Date;
}

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

export class PaginationDTO {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  page?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  limit?: number;
}

export class PaginationWithSearchDTO extends PaginationDTO {
  @IsString()
  @IsOptional()
  q?: string;
}
