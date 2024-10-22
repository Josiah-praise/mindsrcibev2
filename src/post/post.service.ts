import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PrismaService } from 'src/services/prisma.service';
import { UserResponseDto } from 'src/users/dto/userResponse.dto';
import { FileUploadService } from 'src/services/fileUpload.service';
import { CreatePostResponseDto } from './dto/postResponse.dto';
import { PaginatedPostResponse } from './dto/paginatedPostResponse.dto';
import { CommentResponseDto } from 'src/dtos/comments.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PostService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly fileUploadService: FileUploadService,
  ) {}
  async create(
    createPostDto: CreatePostDto,
    userId: string,
    file?: Express.Multer.File,
  ): Promise<CreatePostResponseDto> {
    let bannerUrl;
    bannerUrl = createPostDto.bannerUrl; // bannerUrl should take precedence over file upload
    if (!bannerUrl && file)
      // if no  url is sent, upload the file and get the url
      bannerUrl = await this.fileUploadService.uploadFile(file, userId);

    let data;

    // data should be different depending on whether we are using the default bannerUrl or not
    if (bannerUrl) {
      data = {
        ...createPostDto,
        bannerUrl,
        authorId: userId,
      };
    } else {
      data = {
        ...createPostDto,
        authorId: userId,
      };
    }

    try {
      const post = await this.prismaService.post.create({ data });
      return post;
    } catch (err) {
      throw new InternalServerErrorException({
        message: 'Error creating post',
        error: err.message,
      });
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    searchQuery: string = '',
    authorId?: string,
  ): Promise<PaginatedPostResponse> {
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    // first get the total number of records that match that query
    const total = await this.prismaService.post.count({
      where: {
        OR: searchQuery
          ? [
              { title: { contains: searchQuery, mode: 'insensitive' } },
              { content: { contains: searchQuery, mode: 'insensitive' } },
            ]
          : undefined,
        authorId,
      },
    });

    if (!total)
      // if total is 0
      return {
        data: [],
        meta: {
          total,
          page: 0,
          currPageTotal: 0,
          limit,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

    // calculate number of pages
    const totalPages = Math.ceil(total / limit);

    // ensure that the requested page is never above the total number of pages
    page = page > totalPages ? totalPages : page;

    // calculates the number of records to skip taking
    const skip = (page - 1) * limit;

    const posts = await this.prismaService.post.findMany({
      skip,
      take: limit,
      where: {
        OR: searchQuery
          ? [
              { title: { contains: searchQuery, mode: 'insensitive' } },
              { content: { contains: searchQuery, mode: 'insensitive' } },
            ]
          : undefined,
        authorId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        author: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            username: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    return {
      data: posts,
      meta: {
        total,
        page,
        currPageTotal: posts.length,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string) {
    return await this.prismaService.post.findUnique({
      where: {
        id,
      },
      include: {
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
        author: {
          select: {
            id: true,
            avatarUrl: true,
            firstname: true,
            lastname: true,
          },
        },
      },
    });
  }

  async update(
    user: UserResponseDto,
    file: Express.Multer.File,
    postId: string,
    updatePostDto: UpdatePostDto,
  ) {
    let bannerUrl;
    bannerUrl = updatePostDto.bannerUrl; // bannerUrl should take precedence over file upload
    if (!bannerUrl && file)
      // if no  url is sent, upload the file and get the url
      bannerUrl = await this.fileUploadService.uploadFile(file, user.id);

    return await this.prismaService.post.update({
      where: { id: postId },
      data: {
        ...updatePostDto,
        bannerUrl: bannerUrl ? bannerUrl : undefined,
      },
    });
  }

  async remove(id: string) {
    try {
      return await this.prismaService.post.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      )
        throw new NotFoundException("Post doesn't exist");
      throw error;
    }
  }

  async uploadFile(user: UserResponseDto, file: Express.Multer.File) {
    return await this.fileUploadService.uploadFile(file, user.id);
  }

  // async getUserPosts(
  //   userId: string,
  //   searchQuery: string,
  //   page: number,
  //   limit: number,
  // ) {
  //   if (page < 1) page = 1;
  //   if (limit < 1) limit = 10;

  //   // first get the total number of records that match that query
  //   const total = await this.prismaService.post.count({
  //     where: {
  //       OR: searchQuery
  //         ? [
  //             { title: { contains: searchQuery, mode: 'insensitive' } },
  //             { content: { contains: searchQuery, mode: 'insensitive' } },
  //           ]
  //         : undefined,
  //       authorId: userId,
  //     },
  //   });

  //   // calculate number of pages
  //   const totalPages = Math.ceil(total / limit);

  //   // ensure that the requested page is never above the total number of pages
  //   page = page > totalPages ? totalPages : page;

  //   // calculates the number of records to skip taking
  //   // into account that totalPages can be 0 if no match for the query exists
  //   const skip = page >= 1 ? (page - 1) * limit : 0;
  // }

  // private async getSkipAndLimit(where: any, )

  async likePost(postId: string, userId: string) {
    try {
      return await this.prismaService.postLike.create({
        data: {
          userId,
          postId,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      )
        throw new NotFoundException('Post does not exist');
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        throw new ConflictException('Post has already been liked');
      throw error;
    }
  }

  async unlikePost(postId: string, userId: string) {
    try {
      return await this.prismaService.postLike.delete({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      )
        throw new NotFoundException('Post was never liked');
      throw error;
    }
  }

  async getLikes(postId: string, user: any) {
    const count = await this.prismaService.postLike.count({
      where: {
        postId,
      },
    });

    let like;
    if (user)
      like = await this.prismaService.postLike.findUnique({
        where: {
          userId_postId: {
            postId,
            userId: user.id,
          },
        },
      });

    return {
      count,
      isLiked: like ? true : false,
    };
  }

  async comment(
    comment: string,
    userId: string,
    postId: string,
  ): Promise<CommentResponseDto> {
    try {
      return await this.prismaService.comment.create({
        data: {
          userId,
          postId,
          comment,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002' // unique constraint error
      )
        throw new ConflictException('You can have only one comment per post');
      throw err;
    }
  }

  async updateComment(
    comment: string,
    userId: string,
    postId: string,
  ): Promise<CommentResponseDto> {
    try {
      return await this.prismaService.comment.update({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
        data: {
          comment,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        // Handle the case where the comment doesn't exist
        throw new NotFoundException('Comment not found');
      }
      throw error;
    }
  }

  async getComments(postId: string, page: number = 1, limit: number = 10) {
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    const total = await this.prismaService.comment.count({
      where: {
        postId,
      },
    });

    if (!total)
      return {
        data: [],
        meta: {
          total,
          page: 0,
          currPageTotal: 0,
          limit,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

    const totalPages = Math.ceil(total / limit);
    page = page > totalPages ? totalPages : page;
    const skip = (page - 1) * limit;

    const comments = await this.prismaService.comment.findMany({
      where: {
        postId,
      },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstname: true,
            lastname: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      data: comments,
      meta: {
        total,
        page,
        currPageTotal: comments.length,
        limit,
        totalPages,
        hasNextPage: totalPages > page,
        hasPreviousPage: page > 1,
      },
    };
  }

  async deleteComment(postId: string, userId: string) {
    try {
      await this.prismaService.comment.delete({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      )
        throw new NotFoundException("Comment doesn't exist");
      throw error;
    }
  }

  async bookmark(postId: string, userId: string) {
    try {
      return await this.prismaService.bookmark.create({
        data: {
          userId,
          postId,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        throw new ConflictException('Post is already bookmarked ');
      throw error;
    }
  }

  async removeBookmark(userId: string, postId: string) {
    try {
      await this.prismaService.bookmark.delete({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      )
        throw new NotFoundException(
          'Post was never bookmarked in the first place',
        );
      throw error;
    }
  }

  async getBookmark(postId: string, userId: string) {
    const bookmark = await this.prismaService.bookmark.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });
    return bookmark
      ? { isBookmarked: true, bookmarkedAt: bookmark.createdAt }
      : { isBookmarked: false, bookmarkedAt: null };
  }
}
