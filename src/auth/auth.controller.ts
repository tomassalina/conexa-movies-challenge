import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { zodToOpenApiSchema } from '../common/openapi/zod-schema.util.js';
import { StripSensitiveFieldsInterceptor } from '../common/interceptors/strip-sensitive-fields.interceptor.js';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';
import { AnyAuthenticatedUser } from './decorators/any-authenticated-user.decorator.js';
import { Public } from './decorators/public.decorator.js';
import { loginSchema, type LoginDto } from './dto/login.dto.js';
import { signupSchema, type SignupDto } from './dto/signup.dto.js';
import type { RequestWithUser } from './interfaces/request-with-user.interface.js';

const accessTokenResponseSchema = {
  type: 'object' as const,
  properties: { accessToken: { type: 'string' as const } },
  required: ['accessToken'],
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Get('me')
  @AnyAuthenticatedUser()
  @UseInterceptors(StripSensitiveFieldsInterceptor)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the currently authenticated user (from the bearer token)' })
  @ApiResponse({ status: 200, description: 'The authenticated user, without passwordHash' })
  @ApiResponse({
    status: 401,
    description: 'Missing/invalid bearer token, or the user no longer exists',
  })
  async me(@Req() request: RequestWithUser) {
    const user = await this.usersService.findById(request.user.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }

  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'Register a new user (always created with the "user" role)' })
  @ApiBody({ schema: zodToOpenApiSchema(signupSchema) })
  @ApiResponse({
    status: 201,
    description: 'User created, returns a JWT access token',
    schema: accessTokenResponseSchema,
  })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  signup(@Body({ schema: signupSchema }) dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Log in with email and password and obtain a JWT access token' })
  @ApiBody({ schema: zodToOpenApiSchema(loginSchema) })
  @ApiResponse({
    status: 201,
    description: 'Credentials valid, returns a JWT access token',
    schema: accessTokenResponseSchema,
  })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  login(@Body({ schema: loginSchema }) dto: LoginDto) {
    return this.authService.login(dto);
  }
}
