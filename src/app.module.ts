import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { DocentesModule } from './docentes/docentes.module';
import { EstudiantesModule } from './estudiantes/estudiantes.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    DocentesModule,
    EstudiantesModule,
    AuthModule,
  ],
})
export class AppModule {}
