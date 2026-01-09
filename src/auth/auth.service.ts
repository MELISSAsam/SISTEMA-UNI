import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaAuthService } from '../lib/prisma-auth.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaAuthService,
    private jwtService: JwtService,
  ) { }

  async validateUser(email: string, password: string) {
    try {
      const user = await this.prisma.executeWithCircuitBreaker(
        async () => {
          return await this.prisma.usuario.findUnique({ where: { email } });
        },
        'validate-user',
      );

      if (!user) throw new UnauthorizedException('Credenciales inválidas');

      const passwordValid = await bcrypt.compare(password, user.password);

      if (!passwordValid) throw new UnauthorizedException('Credenciales inválidas');

      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Authentication service temporarily unavailable');
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.validateUser(email, password);

    const payload = { sub: user.id, email: user.email };

    return {
      userId: user.id,
      email: user.email,
      access_token: this.jwtService.sign(payload),
    };
  }
}
