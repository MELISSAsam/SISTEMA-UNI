import { Module } from '@nestjs/common';
import { DocentesService } from './docentes.service';
import { DocentesController } from './docentes.controller';
import { PrismaAcademicService } from '../prisma/prisma-academic.service';
import { PrismaProfilesService } from '../prisma/prisma-profiles.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DocentesController],
  providers: [DocentesService, PrismaAcademicService, PrismaProfilesService],
})
export class DocentesModule { }
