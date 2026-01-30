import { Injectable } from '@nestjs/common';
import { CreateDocenteDto } from './dto/create-docente.dto';
import { UpdateDocenteDto } from './dto/update-docente.dto';
import { PrismaAcademicService } from '../prisma/prisma-academic.service';

/**
 * Docentes Service
 * Delegates to DocenteSyncService for cross-database operations
 */
@Injectable()
export class DocentesService {
  constructor(private prisma: PrismaAcademicService) { }

  // Crear un docente
  async create(data: CreateDocenteDto) {
    // Registrar en BD académica
    return this.prisma.docente.create({
      data: {
        nombre: data.nombre,
        email: data.email,
        carreraId: data.carreraId,
        // especialidadId se ignora aquí o se maneja en Profiles
      }
    });
  }

  // Listar todos los docentes
  findAll() {
    return this.prisma.docente.findMany();
  }

  // Buscar un docente por ID
  findOne(id: number) {
    return this.prisma.docente.findUnique({ where: { id } });
  }

  // Actualizar un docente por ID
  update(id: number, data: UpdateDocenteDto) {
    return this.prisma.docente.update({
      where: { id },
      data: {
        nombre: data.nombre,
        email: data.email,
        carreraId: data.carreraId,
      }
    });
  }

  // Eliminar un docente por ID
  remove(id: number) {
    return this.docenteSync.remove(id);
  }
}
