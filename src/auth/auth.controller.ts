import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

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


  @Post('forgot-password')
forgotPassword(@Body('email') email: string) {
  return this.authService.requestPasswordReset(email);
}

@Post('reset-password')
resetPassword(@Body('token') token: string, @Body('newPassword') newPassword: string) {
  return this.authService.resetPassword(token, newPassword);
}

@UseGuards(JwtAuthGuard)
@Post('change-password')
changePassword(
  @Request() req,
  @Body('oldPassword') oldPass: string,
  @Body('newPassword') newPass: string
) {
  return this.authService.changePassword(req.user.userId, oldPass, newPass);
}

@UseGuards(JwtAuthGuard)
@Post('change-username')
changeUsername(
  @Request() req,
  @Body('newName') newName: string
) {
  return this.authService.changeUsername(req.user.userId, newName);
}


}
