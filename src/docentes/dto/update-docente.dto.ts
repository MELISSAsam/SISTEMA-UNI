import { PartialType } from '@nestjs/mapped-types';
import { CreateDocenteDto } from './create-docente.dto';

export class UpdateDocenteDto {
  nombre?: string;
  email?: string;
  carreraId?: number;
  especialidadId?: number;
}