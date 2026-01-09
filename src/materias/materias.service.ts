import { Injectable } from '@nestjs/common';
import { MateriaSyncService } from '../services/materia-sync.service';

/**
 * Materias Service
 * Delegates to MateriaSyncService for cross-database operations
 */
@Injectable()
export class MateriasService {
  constructor(private materiaSync: MateriaSyncService) { }

  create(data: any) {
    return this.materiaSync.create(data);
  }

  findAll() {
    return this.materiaSync.findAll();
  }

  findOne(id: number) {
    return this.materiaSync.findOne(id);
  }

  update(id: number, data: any) {
    return this.materiaSync.update(id, data);
  }

  remove(id: number) {
    return this.materiaSync.remove(id);
  }

  // Assign students to materia
  assignStudents(materiaId: number, estudianteIds: number[]) {
    return this.materiaSync.assignStudents(materiaId, estudianteIds);
  }

  // Remove students from materia
  removeStudents(materiaId: number, estudianteIds: number[]) {
    return this.materiaSync.removeStudents(materiaId, estudianteIds);
  }
}
