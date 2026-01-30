import { Module } from '@nestjs/common';
import { MateriasService } from './materias.service';
import { MateriasController } from './materias.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaAcademicService } from '../prisma/prisma-academic.service';

@Module({
  imports: [PrismaModule],
  controllers: [MateriasController],
  providers: [MateriasService, PrismaAcademicService],
})
export class MateriasModule { }
