import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { DocentesModule } from './docentes/docentes.module';
import { EstudiantesModule } from './estudiantes/estudiantes.module';


@Module({
  imports: [
    PrismaModule,
    DocentesModule,
    EstudiantesModule, // <-- agrega aquí
  ],
})
export class AppModule {}