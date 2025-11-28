import { Module } from '@nestjs/common';
import { EspecialidadesService } from './especialidades.service'; 
import { EspecialidadController } from './especialidades.controller';

@Module({
  controllers: [EspecialidadController],
  providers: [EspecialidadesService],
})
export class EspecialidadModule {}
