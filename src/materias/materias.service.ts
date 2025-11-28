import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Materia, Prisma } from '@prisma/client';

@Injectable()
export class MateriasService {
  constructor(private prisma: PrismaService) {}

  create(data: Prisma.MateriaCreateInput): Promise<Materia> {
    return this.prisma.materia.create({ data });
  }

  findAll(): Promise<Materia[]> {
    return this.prisma.materia.findMany({
      include: { docente: true, carrera: true, estudiantes: true },
    });
  }

  findOne(id: number): Promise<Materia | null> {
    return this.prisma.materia.findUnique({
      where: { id },
      include: { docente: true, carrera: true, estudiantes: true },
    });
  }

  update(id: number, data: Prisma.MateriaUpdateInput): Promise<Materia> {
    return this.prisma.materia.update({
      where: { id },
      data,
    });
  }

  remove(id: number): Promise<Materia> {
    return this.prisma.materia.delete({
      where: { id },
    });
  }
}
