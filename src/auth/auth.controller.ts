import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

type SignupDto = { email: string; password: string; name: string };
type LoginDto  = { email: string; password: string };

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** 201 Created + token */
  @Post('signup')
  async signup(@Body() body: SignupDto) {
    const token = await this.authService.signup(
      body.email,
      body.password,
      body.name,
    );
    return { access_token: token };
  }

  /** 200 OK + token (override default 201) */
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() body: LoginDto) {
    const token = await this.authService.login(body.email, body.password);
    return { access_token: token };
  }
}
