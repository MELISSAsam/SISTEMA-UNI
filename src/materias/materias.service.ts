import { Injectable } from '@nestjs/common';
import { PrismaAcademicService } from '../prisma/prisma-academic.service';
// import { CreateMateriaDto } from './dto/create-materia.dto'; // Asumiendo que existe o usar any

@Injectable()
export class MateriasService {
  constructor(private prisma: PrismaAcademicService) { }

  create(data: any) {
    return this.prisma.materia.create({
      data: {
        nombre: data.nombre,
        codigo: data.codigo,
        docenteId: data.docenteId,
        carreraId: data.carreraId,
        cupos: data.cupos,
      }
    });
  }

  findAll() {
    return this.prisma.materia.findMany();
  }

  findOne(id: number) {
    return this.prisma.materia.findUnique({ where: { id } });
  }

  update(id: number, data: any) {
    return this.prisma.materia.update({
      where: { id },
      data: {
        nombre: data.nombre,
        codigo: data.codigo,
        // ...
      }
    });
  }

  remove(id: number) {
    return this.prisma.materia.delete({ where: { id } });
  }

  // Assign students to materia (connect)
  assignStudents(materiaId: number, estudianteIds: number[]) {
    return this.prisma.materia.update({
      where: { id: materiaId },
      data: {
        estudiantes: {
          connect: estudianteIds.map(id => ({ id }))
        }
      }
    });
  }

  // Remove students from materia (disconnect)
  removeStudents(materiaId: number, estudianteIds: number[]) {
    return this.prisma.materia.update({
      where: { id: materiaId },
      data: {
        estudiantes: {
          disconnect: estudianteIds.map(id => ({ id }))
        }
      }
    });
  }
}
