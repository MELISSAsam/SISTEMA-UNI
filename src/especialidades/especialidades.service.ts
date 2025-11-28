import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Especialidad, Prisma } from '@prisma/client';

@Injectable()
export class EspecialidadesService {
  constructor(private prisma: PrismaService) {}

  create(data: Prisma.EspecialidadCreateInput): Promise<Especialidad> {
    return this.prisma.especialidad.create({ data });
  }

  findAll(): Promise<Especialidad[]> {
    return this.prisma.especialidad.findMany({
      include: { docentes: true },
    });
  }

  findOne(id: number): Promise<Especialidad | null> {
    return this.prisma.especialidad.findUnique({
      where: { id },
      include: { docentes: true },
    });
  }

  update(id: number, data: Prisma.EspecialidadUpdateInput): Promise<Especialidad> {
    return this.prisma.especialidad.update({
      where: { id },
      data,
    });
  }

  remove(id: number): Promise<Especialidad> {
    return this.prisma.especialidad.delete({
      where: { id },
    });
  }
}
