import {
  Controller,
  Post,
  Body,
  Get,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Req,
  UseGuards,
  Query,
  Param,
  Put,
  BadRequestException,
  ParseUUIDPipe,
  NotFoundException,
  ForbiddenException,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiResponse,
  ApiNoContentResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiTags,
  ApiBody,
  ApiUnauthorizedResponse,
  ApiOkResponse,
  ApiQuery,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiParam,
} from '@nestjs/swagger';
import { PrismaService } from 'src/services/prisma.service';
import { JwtGuard } from 'src/auth/jwt.guard';
import { Request } from 'express';
import { UserResponseDto } from 'src/users/dto/userResponse.dto';
import { ApiResponseOptionsGenerator } from 'src/utilities';
import { CreatePostResponseDto } from './dto/postResponse.dto';
import { PaginatedPostResponse } from './dto/paginatedPostResponse.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CommentResponseDto, CreateCommentDto } from 'src/dtos/comments.dto';
import { OptionalJwtGuard } from 'src/auth/optionaljwt.strategy';

@ApiTags('posts')
@Controller('posts')
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly prismaService: PrismaService,
  ) {}

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new post',
    description: 'Creates a new blog post with optional banner image.',
  })
  @ApiUnauthorizedResponse(ApiResponseOptionsGenerator('Unauthorized'))
  @ApiBadRequestResponse(ApiResponseOptionsGenerator('Bad Request'))
  @ApiInternalServerErrorResponse(
    ApiResponseOptionsGenerator('Internal server error'),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'content'],
      properties: {
        title: {
          type: 'string',
          example: 'The Art of Coding',
          description: 'Title of the post (3-100 characters)',
        },
        content: {
          type: 'string',
          example:
            'In this post, we will explore the fundamentals of coding...',
          description: 'Main content of the post (minimum 10 characters)',
        },
        banner: {
          type: 'string',
          format: 'binary',
          description: 'Optional banner image (max 5MB, jpg/png/gif)',
        },
        published: {
          type: 'boolean',
          example: false,
          description: 'Whether the post should be published immediately',
          default: true,
        },
        readTime: {
          type: 'integer',
          example: 2,
          description: 'Estimated reading time in minutes',
        },
        seriesId: {
          type: 'string',
          format: 'uuid',
          example: '123e4567-e89b-12d3-a456-426614174000',
          description: 'Optional UUID of the series this post belongs to',
        },
      },
    },
  })
  @ApiCreatedResponse({
    type: CreatePostResponseDto,
  })
  @UseGuards(JwtGuard)
  @UseInterceptors(FileInterceptor('banner'))
  @Post()
  async create(
    @Body() createPostDto: CreatePostDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1000 * 1000 * 5 }), //5MB
          new FileTypeValidator({ fileType: /image\/(jpeg|png|gif)/ }),
        ],
        fileIsRequired: false,
      }),
    )
    file: Express.Multer.File,
    @Req() req: Request,
  ) {
    return await this.postService.create(
      createPostDto,
      (req.user as any).id,
      file,
    );
  }

  @ApiOperation({
    description:
      'Get all posts for the logged-in user, with pagination and search functionality',
    summary: 'Retrieve user posts',
  })
  @ApiBearerAuth() // Indicates that the endpoint requires JWT authentication
  @ApiUnauthorizedResponse({
    description: 'Unauthorized request',
  })
  @ApiBadRequestResponse({
    description: 'Invalid query parameters for page or limit',
  })
  @ApiInternalServerErrorResponse({
    description: 'Unexpected error on the server',
  })
  @ApiOkResponse({
    description: 'Successfully retrieved posts',
    type: PaginatedPostResponse,
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Search query to filter posts by title or content',
    example: 'NestJS',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination (should be a number)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Limit of posts per page (should be a number)',
    example: 10,
  })
  @Get('my_post')
  @UseGuards(JwtGuard)
  async getUserPosts(
    @Req() req: Request,
    @Query('q') searchQuery,
    @Query('page') page,
    @Query('limit') limit,
  ) {
    // try converting page and limit values to numbers
    if (page) page = Number(page);
    if (limit) limit = Number(limit);
    if (Number.isNaN(page))
      throw new BadRequestException('page should be a number');
    if (Number.isNaN(limit))
      throw new BadRequestException('limit should be a number');
    return await this.postService.findAll(
      page,
      limit,
      searchQuery,
      (req.user as any).id,
    );
  }

  @ApiOperation({
    summary: 'check if post is liked',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'UUID of the post to be checked',
    schema: { type: 'string', format: 'uuid' },
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 201,
    description: 'The post has been successfully liked',
    schema: {
      type: 'object',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - User is not authenticated',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Post with given ID does not exist',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - User has already liked this post',
  })
  @UseGuards(JwtGuard)
  @Get('isliked/:id')
  async isLiked(@Param('id', ParseUUIDPipe) postId, @Req() req: Request) {
    const count = await this.prismaService.postLike.count({
      where: {
        userId: (req.user as any).id,
        postId,
      },
    });
    return { isLiked: count === 1 };
  }

  @ApiQuery({
    name: 'page',
    type: Number,
    example: 12,
    description: 'The page number to get',
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    example: 10,
    description: 'number of posts in a page',
    required: false,
  })
  @ApiQuery({
    name: 'q',
    type: String,
    example: 'title',
    description: 'a value to perform search with',
    required: false,
  })
  @ApiInternalServerErrorResponse(
    ApiResponseOptionsGenerator('Internal server error'),
  )
  @ApiBadRequestResponse(ApiResponseOptionsGenerator('Bad request'))
  @ApiOkResponse({
    type: PaginatedPostResponse,
  })
  @ApiOperation({
    summary: 'Gets all posts with pagination and search support',
  })
  @Get()
  async findAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('q') searchQuery: string,
  ): Promise<PaginatedPostResponse> {
    // try converting page and limit values to numbers
    if (page) page = Number(page);
    if (limit) limit = Number(limit);
    if (Number.isNaN(page))
      throw new BadRequestException('page should be a number');
    if (Number.isNaN(limit))
      throw new BadRequestException('limit should be a number');
    return await this.postService.findAll(page, limit, searchQuery);
  }

  @ApiOperation({
    description: 'Retrieve a post by its UUID',
    summary: 'Get a post by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the post to retrieve',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  @ApiForbiddenResponse({
    description: 'User does not have permission to access this resource',
  })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format for post ID',
  })
  @ApiNotFoundResponse({
    description: 'Post not found with the provided ID',
  })
  @ApiInternalServerErrorResponse({
    description: 'Unexpected error on the server',
  })
  @ApiOkResponse({
    description: 'Successfully retrieved the post',
    type: CreatePostResponseDto,
  })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.postService.findOne(id);
  }

  @ApiOperation({
    summary: 'Update a post by ID',
    description: 'Update an existing post with optional banner image upload',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'UUID of the post to update',
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        banner: {
          type: 'string',
          format: 'binary',
          description: 'Banner image file (jpeg, png, or gif, max 5MB)',
        },
        title: {
          type: 'string',
          description: 'Updated title of the post',
        },
        content: {
          type: 'string',
          description: 'Updated content of the post',
        },
        published: {
          type: 'boolean',
          description: 'Published status of the post',
        },
        readTime: {
          type: 'number',
          description: 'Estimated read time in minutes',
        },
        seriesId: {
          type: 'string',
          format: 'uuid',
          description: 'UUID of the series this post belongs to',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Post updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        title: { type: 'string' },
        content: { type: 'string' },
        published: { type: 'boolean' },
        readTime: { type: 'number' },
        bannerUrl: { type: 'string' },
        seriesId: { type: 'string', format: 'uuid', nullable: true },
      },
    },
  })
  @ApiBearerAuth()
  @ApiForbiddenResponse(ApiResponseOptionsGenerator('Forbidden'))
  @ApiUnauthorizedResponse(ApiResponseOptionsGenerator('Unauthorized'))
  @ApiNotFoundResponse(ApiResponseOptionsGenerator('Resource not found'))
  @ApiBadRequestResponse(ApiResponseOptionsGenerator('Bad request'))
  @UseGuards(JwtGuard)
  @Put(':id')
  @UseInterceptors(FileInterceptor('banner'))
  async update(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1000 * 1000 * 5 }), //5MB
          new FileTypeValidator({ fileType: /image\/(jpeg|png|gif)/ }),
        ],
        fileIsRequired: false,
      }),
    )
    file: Express.Multer.File,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePostDto: UpdatePostDto,
    @Req() req: Request,
  ) {
    // check if post belongs to signed in user
    const post = await this.postService.findOne(id);
    if (!post) throw new NotFoundException();
    if (post.authorId !== (req.user as any).id) throw new ForbiddenException();

    return await this.postService.update(
      req.user as UserResponseDto,
      file,
      id,
      updatePostDto,
    );
  }

  @ApiOperation({
    summary: 'Delete a post by ID',
    description:
      'Remove an existing post. Only the author can delete their own post.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'UUID of the post to delete',
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiNoContentResponse({
    description: 'Post successfully deleted',
  })
  @ApiForbiddenResponse(
    ApiResponseOptionsGenerator(
      'Forbidden - User is not the author of the post',
    ),
  )
  @ApiUnauthorizedResponse(
    ApiResponseOptionsGenerator('Unauthorized - Authentication required'),
  )
  @ApiNotFoundResponse(
    ApiResponseOptionsGenerator('Resource not found - Post does not exist'),
  )
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    // ensure the resource belongs to the signed in user
    const post = await this.prismaService.post.findUnique({ where: { id } });

    if (!post) throw new NotFoundException();
    if (post.authorId !== (req.user as any).id) throw new ForbiddenException();
  }

  @ApiOperation({
    summary: 'uploads media files sent as form data to s3 bucket',
    description:
      'files must be sent in File field and only a single file should be sent at a time',
  })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiInternalServerErrorResponse(
    ApiResponseOptionsGenerator('Internal server error'),
  )
  @ApiBody({
    description: 'Image file',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiUnauthorizedResponse(ApiResponseOptionsGenerator('Unauthorized'))
  @ApiBadRequestResponse(ApiResponseOptionsGenerator('Bad request'))
  @ApiCreatedResponse({
    description: 'Uploaded image sucessfully',
    example: `{url: 'https://mindscribeblog.s3.us-east-1.amazonaws.com/bb0f79f0-c913-45c5-bb63-3181918652c9/bb0f79f0-c913-45c5-bb63-3181918652c9_2024-10-08_Screenshot_from_2023-12-21_18-43-50.png'}`,
  })
  @UseInterceptors(FileInterceptor('file'))
  @Post('upload_media')
  @UseGuards(JwtGuard)
  async uploadMedia(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1000 * 1000 * 5 }), //5MB
          new FileTypeValidator({ fileType: /image\/(jpeg|png|gif)/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Req() req: Request,
  ): Promise<{ url: string }> {
    const url = await this.postService.uploadFile(
      req.user as UserResponseDto,
      file,
    );
    return { url };
  }

  @ApiOperation({
    summary: 'Like a post',
    description: 'Allows an authenticated user to like a specific post',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'UUID of the post to be liked',
    schema: { type: 'string', format: 'uuid' },
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 201,
    description: 'The post has been successfully liked',
    schema: {
      type: 'object',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - User is not authenticated',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Post with given ID does not exist',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - User has already liked this post',
  })
  @Post(':id/likes')
  @UseGuards(JwtGuard)
  async likePost(@Param('id', ParseUUIDPipe) postId, @Req() req: Request) {
    const userId = (req.user as any).id;
    return await this.postService.likePost(postId, userId);
  }

  @ApiOperation({
    summary: 'Unlike a post',
    description: 'Allows an authenticated user to unlike a specific post',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'UUID of the post to be liked',
    schema: { type: 'string', format: 'uuid' },
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'The post has been successfully liked',
    schema: {
      type: 'object',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - User is not authenticated',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - You never liked this post',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtGuard)
  @Delete(':id/likes')
  async unlikePost(@Param('id', ParseUUIDPipe) postId, @Req() req: Request) {
    const userId = (req.user as any).id;
    return await this.postService.unlikePost(postId, userId);
  }

  @ApiOperation({
    summary: 'Get total likes for a post',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'UUID of the post to be liked',
    schema: { type: 'string', format: 'uuid' },
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Post with given ID does not exist',
  })
  @ApiResponse({
    status: 200,
    example: { count: 20 },
  })
  @UseGuards(OptionalJwtGuard)
  @Get(':postId/likes')
  async getLikes(@Param('postId', ParseUUIDPipe) postId, @Req() req: Request) {
    return await this.postService.getLikes(postId, req.user as any);
  }

  @ApiOperation({ description: 'comment on a post' })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'UUID of the post to be liked',
    schema: { type: 'string', format: 'uuid' },
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBearerAuth()
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiNotFoundResponse({ description: 'Post not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @UseGuards(JwtGuard)
  @Post(':id/comments')
  async comment(
    // TODO fix Api Body docs
    @Body() createCommentDto: CreateCommentDto,
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) postId: string,
  ): Promise<CommentResponseDto> {
    const userId = (req.user as any).id as string;
    return await this.postService.comment(
      createCommentDto.comment,
      userId,
      postId,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Put(':postId/comments')
  async updateComment(
    @Body() createCommentDto: CreateCommentDto,
    @Req() req: Request,
    @Param('postId', ParseUUIDPipe) postId: string,
  ) {
    const userId = (req.user as any).id;
    return await this.postService.updateComment(
      createCommentDto.comment,
      userId,
      postId,
    );
  }

  @Get(':postId/comments')
  async getComments(
    @Query('page') page,
    @Query('limit') limit,
    @Param('postId', ParseUUIDPipe) postId: string,
  ) {
    if (page) page = Number(page);
    if (limit) limit = Number(limit);
    if (Number.isNaN(page))
      throw new BadRequestException('page should be a number');
    if (Number.isNaN(limit))
      throw new BadRequestException('limit should be a number');

    return await this.postService.getComments(postId, page, limit);
  }

  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtGuard)
  @Delete(':postId/comments')
  async deleteComment(@Req() req: Request, @Param('postId') postId: string) {
    const userId = (req.user as any).id;
    await this.postService.deleteComment(postId, userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Post(':postId/bookmarks')
  async bookmark(@Param('postId') postId: string, @Req() req: Request) {
    const userId = (req.user as any).id;
    return await this.postService.bookmark(postId, userId);
  }

  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtGuard)
  @Delete(':postId/bookmarks')
  async removeBookmark(@Param('postId') postId: string, @Req() req: Request) {
    const userId = (req.user as any).id;
    return await this.postService.removeBookmark(postId, userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Get(':postId/bookmarks')
  async getBookmark(@Param('postId') postId: string, @Req() req: Request) {
    const userId = (req.user as any).id;
    return await this.postService.getBookmark(postId, userId);
  }
}

// user/userId/posts- get user's posts
//user/userId/bookmarks
//implement following system later
// implement tags and categories

