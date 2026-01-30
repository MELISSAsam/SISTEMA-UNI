import { Module } from '@nestjs/common';
import { CarrerasService } from './carreras.service';
import { CarrerasController } from './carreras.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaAcademicService } from '../prisma/prisma-academic.service';

@Module({
  imports: [PrismaModule],
  controllers: [CarrerasController],
  providers: [CarrerasService, PrismaAcademicService],
})
export class CarrerasModule { }
