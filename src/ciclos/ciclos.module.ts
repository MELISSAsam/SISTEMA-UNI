import { Module } from '@nestjs/common';
import { CiclosService } from './ciclos.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaAcademicService } from '../prisma/prisma-academic.service';
import { CiclosController } from './ciclos.controller';

@Module({
  imports: [PrismaModule],
  controllers: [CiclosController],
  providers: [CiclosService, PrismaAcademicService],
})
export class CiclosModule { }
