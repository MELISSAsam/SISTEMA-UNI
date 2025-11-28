import { Module } from '@nestjs/common';
import { CarrerasService } from './carreras.service';
import { CarrerasController } from './carreras.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [CarrerasController],
  providers: [CarrerasService, PrismaService],
})
export class CarrerasModule {}
