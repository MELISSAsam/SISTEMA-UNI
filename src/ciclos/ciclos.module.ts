import { Module } from '@nestjs/common';
import { CiclosService } from './ciclos.service';
import { CiclosController } from './ciclos.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [CiclosController],
  providers: [CiclosService, PrismaService],
})
export class CiclosModule {}
