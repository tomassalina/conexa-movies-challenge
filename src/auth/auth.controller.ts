import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { loginSchema, type LoginDto } from './dto/login.dto.js';
import { signupSchema, type SignupDto } from './dto/signup.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body({ schema: signupSchema }) dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  login(@Body({ schema: loginSchema }) dto: LoginDto) {
    return this.authService.login(dto);
  }
}
