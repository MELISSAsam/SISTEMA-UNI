import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Carrera, Prisma } from '@prisma/client';

@Injectable()
export class CarrerasService {
  constructor(private prisma: PrismaService) {}

  create(data: Prisma.CarreraCreateInput): Promise<Carrera> {
    return this.prisma.carrera.create({ data });
  }

  findAll(): Promise<Carrera[]> {
    return this.prisma.carrera.findMany({
      include: { docentes: true, materias: true, estudiantes: true },
    });
  }

  findOne(id: number): Promise<Carrera | null> {
    return this.prisma.carrera.findUnique({
      where: { id },
      include: { docentes: true, materias: true, estudiantes: true },
    });
  }

  update(id: number, data: Prisma.CarreraUpdateInput): Promise<Carrera> {
    return this.prisma.carrera.update({
      where: { id },
      data,
    });
  }

  remove(id: number): Promise<Carrera> {
    return this.prisma.carrera.delete({
      where: { id },
    });
  }
}
