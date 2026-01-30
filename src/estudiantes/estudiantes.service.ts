import { Injectable } from '@nestjs/common';
import { CreateEstudianteDto } from './dto/create-estudiante.dto';
import { UpdateEstudianteDto } from './dto/update-estudiante.dto';
import { PrismaAcademicService } from '../prisma/prisma-academic.service';

@Injectable()
export class EstudiantesService {
  constructor(private prisma: PrismaAcademicService) { }

  create(data: CreateEstudianteDto) {
    return this.prisma.estudiante.create({ data });
  }

  findAll() {
    return this.prisma.estudiante.findMany({
      include: { carrera: true, ciclo: true, materias: true },
    });
  }

  findOne(id: number) {
    return this.prisma.estudiante.findUnique({
      where: { id },
      include: { carrera: true, ciclo: true, materias: true },
    });
  }

  update(id: number, data: UpdateEstudianteDto) {
    return this.prisma.estudiante.update({
      where: { id },
      data,
    });
  }

  remove(id: number) {
    return this.prisma.estudiante.delete({
      where: { id },
    });
  }
}
