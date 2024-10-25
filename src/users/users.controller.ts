import {
  Controller,
  ForbiddenException,
  Param,
  Req,
  Put,
  UseGuards,
  Get,
  Body,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Query,
  Patch,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  NotFoundException,
} from '@nestjs/common';
import { JwtGuard } from 'src/auth/jwt.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { Request } from 'express';
import { PrismaService } from 'src/services/prisma.service';
import {
  ApiUnauthorizedResponse,
  ApiParam,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiTags,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { ApiResponseOptionsGenerator } from 'src/utilities';
import {
  PaginatedUsersDto,
  UserResponseDto,
} from 'src/users/dto/userResponse.dto';
import { UsersService } from './users.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { PaginationDTO } from 'src/post/post.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UsersService,
  ) {}

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'For updating existing users',
    description: 'gets users details and updates them',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized request',
  })
  @ApiForbiddenResponse({
    description: 'User does not have permission to update this resource',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid request payload or parameter',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the user to be updated',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    description: 'The credentials of the user to be updated',
  })
  @ApiInternalServerErrorResponse({
    description: 'Unexpected error on the server',
  })
  @ApiCreatedResponse({
    description: 'User successfully updated',
    type: UserResponseDto,
  })
  @UseGuards(JwtGuard)
  @Put(':id')
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: Request,
  ): Promise<UserResponseDto> {
    // ensure the id belongs to the logged in user
    if (id !== (req.user as any).id) throw new ForbiddenException();

    return await this.userService.updateUser(id, updateUserDto);
  }

  @ApiInternalServerErrorResponse(
    ApiResponseOptionsGenerator('Internal server error'),
  )
  @ApiNotFoundResponse(ApiResponseOptionsGenerator('Resource not found'))
  @ApiBadRequestResponse(ApiResponseOptionsGenerator('Bad request'))
  @ApiOkResponse({
    description: 'Successful request',
    type: UserResponseDto,
  })
  @ApiParam({
    name: 'id',
    description: 'User UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Get User by UUID',
  })
  @Get(':id')
  async getUserById(@Param('id', ParseUUIDPipe) id: string) {
    return await this.userService.getUserById(id);
  }

  @ApiQuery({
    name: 'page',
    description: 'page number',
    example: 3,
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: 'users per page',
    example: 3,
    type: Number,
    required: false,
  })
  @ApiOperation({
    summary: 'Get all Users',
  })
  @ApiOkResponse({
    description: 'Successful request',
    type: PaginatedUsersDto,
  })
  @ApiInternalServerErrorResponse(
    ApiResponseOptionsGenerator('Internal server error'),
  )
  @ApiBadRequestResponse({ description: 'Bad request' })
  @Get()
  async getUsers(@Query() paginationDTO: PaginationDTO) {
    return await this.userService.findAll(
      paginationDTO.page,
      paginationDTO.limit,
    );
  }

  @ApiUnauthorizedResponse(ApiResponseOptionsGenerator('Unauthorized'))
  @ApiForbiddenResponse(ApiResponseOptionsGenerator('Forbidden'))
  @ApiNotFoundResponse(ApiResponseOptionsGenerator('Resource not found'))
  @ApiBadRequestResponse(ApiResponseOptionsGenerator('Bad Request'))
  @ApiNoContentResponse(ApiResponseOptionsGenerator('No content'))
  @ApiInternalServerErrorResponse(
    ApiResponseOptionsGenerator('Internal server error'),
  )
  @ApiParam({
    name: 'id',
    description: 'User UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOperation({
    summary: 'Delete User by UUID',
  })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtGuard)
  @Delete(':userId')
  async deleteUserById(
    @Req() req: Request,
    @Param('userId', ParseUUIDPipe) userId,
  ) {
    if (userId !== (req.user as any).id) throw new ForbiddenException();
    await this.userService.deleteUserById((req.user as any).id);
  }

  @UseInterceptors(FileInterceptor('avatar'))
  @UseGuards(JwtGuard)
  @Patch('me/avatar')
  async uploadAvatar(
    @Req() req: Request,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1000 * 1000 * 5 }),
          new FileTypeValidator({ fileType: /image\/(jpeg|png)/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return await this.uploadAvatar((req.user as any).id, file);
  }
}
