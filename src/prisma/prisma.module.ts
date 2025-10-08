import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Opcional, para que esté disponible en todos los módulos
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
