import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DocentesModule } from './docentes/docentes.module';
import { EstudiantesModule } from './estudiantes/estudiantes.module';
import { UsuariosModule } from './usuarios/usuarios.module';

// New modules for 3-database architecture
import { LibModule } from './lib/lib.module';
import { SyncModule } from './services/sync.module';
import { HealthModule } from './health/health.module';
import { DatabaseErrorFilter } from './common/filters/database-error.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Core database and sync modules
    LibModule,
    SyncModule,
    HealthModule,
    // Feature modules
    DocentesModule,
    EstudiantesModule,
    AuthModule,
    UsuariosModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global error filter for database errors
    {
      provide: APP_FILTER,
      useClass: DatabaseErrorFilter,
    },
  ],
})
export class AppModule { }

