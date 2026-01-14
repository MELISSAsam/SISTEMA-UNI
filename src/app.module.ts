import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DocentesModule } from './docentes/docentes.module';
import { EstudiantesModule } from './estudiantes/estudiantes.module';
import { UsuariosModule } from './usuarios/usuarios.module';

import { PrismaModule } from './prisma/prisma.module';
import { PrismaUsersService } from './prisma/prisma-users.service';
import { PrismaAcademicService } from './prisma/prisma-academic.service';
import { PrismaProfilesService } from './prisma/prisma-profiles.service';
import { DatabaseErrorFilter } from './common/filters/database-error.filter';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    // Feature modules
    ReportsModule,
    DocentesModule,
    EstudiantesModule,
    AuthModule,
    UsuariosModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaUsersService,
    PrismaAcademicService,
    PrismaProfilesService,
    // Global error filter for database errors
    {
      provide: APP_FILTER,
      useClass: DatabaseErrorFilter,
    },
  ],
  exports: [
    PrismaUsersService,
    PrismaAcademicService,
    PrismaProfilesService,
  ]
})
export class AppModule { }

