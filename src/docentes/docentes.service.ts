import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocenteDto } from './dto/create-docente.dto';
import { UpdateDocenteDto } from './dto/update-docente.dto';

@Injectable()
export class DocentesService {
  constructor(private prisma: PrismaService) {}

  // Crear un docente
  create(data: CreateDocenteDto) {
    return this.prisma.docente.create({ data });
  }

  // Listar todos los docentes
  findAll() {
    return this.prisma.docente.findMany({
      include: { carrera: true, especialidad: true },
    });
  }

  // Buscar un docente por ID
  findOne(id: number) {
    return this.prisma.docente.findUnique({
      where: { id },
      include: { carrera: true, especialidad: true },
    });
  }

  // Actualizar un docente por ID
  update(id: number, data: UpdateDocenteDto) {
    return this.prisma.docente.update({
      where: { id },
      data,
    });
  }

  // Eliminar un docente por ID
  remove(id: number) {
    return this.prisma.docente.delete({
      where: { id },
    });
  }
}
