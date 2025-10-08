import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { DocentesModule } from './docentes/docentes.module';

@Module({
  imports: [PrismaModule, DocentesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
