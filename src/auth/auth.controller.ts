import { Body, Controller, Post, Get, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto';
import { Auth } from './decorators';

interface RequestWithUser extends Request {
  user: any;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Auth()
  @Get('profile')
  getProfile(@Req() req: RequestWithUser) {
    return req.user;
  }
}
