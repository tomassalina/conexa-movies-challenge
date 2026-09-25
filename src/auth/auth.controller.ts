import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
  UseInterceptors,
} from '@nestjs/common';
import { StripSensitiveFieldsInterceptor } from '../common/interceptors/strip-sensitive-fields.interceptor.js';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';
import { AnyAuthenticatedUser } from './decorators/any-authenticated-user.decorator.js';
import { Public } from './decorators/public.decorator.js';
import { loginSchema, type LoginDto } from './dto/login.dto.js';
import { signupSchema, type SignupDto } from './dto/signup.dto.js';
import type { RequestWithUser } from './interfaces/request-with-user.interface.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Get('me')
  @AnyAuthenticatedUser()
  @UseInterceptors(StripSensitiveFieldsInterceptor)
  async me(@Req() request: RequestWithUser) {
    const user = await this.usersService.findById(request.user.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }

  @Public()
  @Post('signup')
  signup(@Body({ schema: signupSchema }) dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Public()
  @Post('login')
  login(@Body({ schema: loginSchema }) dto: LoginDto) {
    return this.authService.login(dto);
  }
}
