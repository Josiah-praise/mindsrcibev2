import {
  Controller,
  Post,
  Get,
  Body,
  HttpStatus,
  HttpCode,
  Req,
} from '@nestjs/common';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { AuthService } from './auth.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtGuard } from './jwt.guard';
import { RedisService } from '../services/redis.service';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiTags,
  ApiNoContentResponse,
  ApiHeader,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiBody,
} from '@nestjs/swagger';
import { ApiResponseOptionsGenerator } from 'src/utilities';
import { SignupReturnDto } from './dto/signup.return.dto';
import { SignInDto } from './dto/signin.dto';
import { UserLoginInfoService } from 'src/services/logininfo.service';
import { EmailService } from 'src/services/email.service';
import { join } from 'path';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly userLoginInfoService: UserLoginInfoService,
    private readonly emailService: EmailService,
  ) {}

  @ApiOperation({
    summary: 'User registration',
    description:
      'Create a new user account and return access token along with user details',
  })
  // @ApiBody({
  //   type: CreateUserDto,
  //   description: 'User registration details',
  //   examples: {
  //     userRegistration: {
  //       summary: 'User Registration Example',
  //       value: {
  //         email: 'newuser@example.com',
  //         password: 'P@ssw0rd123',
  //         firstname: 'John',
  //         lastname: 'Doe',
  //         username: 'deeznuts3000',
  //       },
  //     },
  //   },
  // })
  @ApiCreatedResponse({
    description: 'User created successfully',
    type: SignupReturnDto,
  })
  @ApiBadRequestResponse({
    description: 'Bad request - Invalid input',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'array',
          items: {
            type: 'string',
          },
          example: [
            'Password is too weak. It must include uppercase and lowercase letters, numbers, and special characters.',
            'Email must be a valid email address',
          ],
        },
        error: {
          type: 'string',
          example: 'Bad Request',
        },
        statusCode: {
          type: 'number',
          example: 400,
        },
      },
    },
  })
  @ApiConflictResponse(
    ApiResponseOptionsGenerator(
      'Conflict - Email already exists/User already exists/Username already taken',
    ),
  )
  @ApiInternalServerErrorResponse(
    ApiResponseOptionsGenerator('Internal server error'),
  )
  @Post('signup')
  async signUp(@Body() createUserDto: CreateUserDto): Promise<SignupReturnDto> {
    const user = await this.authService.createAccount(createUserDto);
    const payload = { id: user.id, email: user.email };
    delete user.password;
    return {
      access_token: this.jwtService.sign(payload, {
        expiresIn: '7d',
        secret: this.configService.get<string>('SECRET'),
      }),
      user,
    };
  }

  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate a user and return a JWT access token',
  })
  @ApiBody({
    type: SignInDto,
    description: 'User credentials',
    examples: {
      userCredentials: {
        summary: 'User Credentials Example',
        value: {
          email: 'user@example.com',
          password: 'password123',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Successfully authenticated',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          description: 'JWT token that expires in 7 days',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        user: {
          type: 'SignupReturnDto',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials',
  })
  @ApiBadRequestResponse({
    description: 'Invalid request body',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  @UseGuards(AuthGuard('local'))
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Req() req: Request) {
    const user = req.user as any;
    // TODO send a login mail each time a user logs in
    // const userInfo = await this.userLoginInfoService.extractLoginInfo(req);
    // const formattedTemplate = await this.emailService.getFormattedTemplate(
    //   join(
    //     this.configService.get<string>('TEMPLATE_DIRS') ||
    //       '/home/praise-afk/Desktop/blog/templates/',
    //     'login.hbs',
    //   ),
    //   userInfo,
    // );
    // await this.emailService.sendMail(
    //   (req.user as any).email,
    //   formattedTemplate,
    //   'Account Login',
    // );

    const payload = { id: user.id, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload, {
        expiresIn: '7d',
        secret: this.configService.get<string>('SECRET'),
      }),
      user: req.user,
    };
  }

  @ApiOperation({
    summary: 'Logout user',
    description:
      'Invalidates the current JWT token by adding it to a blocklist in Redis',
  })
  @ApiNoContentResponse({
    description: 'Successfully logged out',
  })
  @ApiUnauthorizedResponse({
    description:
      'Unauthorized - token is already invalid. No need to logout. Just Sign In afresh',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer JWT token',
    required: true,
    schema: {
      type: 'string',
      example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    },
  })
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Get('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request) {
    //.calculate the ttl for the token and then store in redis with that ttl
    const token = req.headers.authorization.split(' ')[1];
    const userId = (req.user as any).id;

    await this.redisService.invalidateToken(userId, token);
  }

  // @ApiBearerAuth()
  // @UseGuards(JwtGuard)
  // @Get('test')
  // async test() {
  //   return { data: 'This is a protected route' };
  // }
}
