import { Injectable } from '@nestjs/common';
import { DocenteSyncService } from '../services/docente-sync.service';
import { CreateDocenteDto } from './dto/create-docente.dto';
import { UpdateDocenteDto } from './dto/update-docente.dto';

/**
 * Docentes Service
 * Delegates to DocenteSyncService for cross-database operations
 */
@Injectable()
export class DocentesService {
  constructor(private docenteSync: DocenteSyncService) { }

  // Crear un docente
  create(data: CreateDocenteDto) {
    return this.docenteSync.create(data);
  }

  // Listar todos los docentes
  findAll() {
    return this.docenteSync.findAll();
  }

  // Buscar un docente por ID
  findOne(id: number) {
    return this.docenteSync.findOne(id);
  }

  // Actualizar un docente por ID
  update(id: number, data: UpdateDocenteDto) {
    return this.docenteSync.update(id, data);
  }

  // Eliminar un docente por ID
  remove(id: number) {
    return this.docenteSync.remove(id);
  }
}
