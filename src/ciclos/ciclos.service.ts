import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaAcademicService } from '../prisma/prisma-academic.service';
import { Ciclo, Prisma } from '@prisma/client';

@Injectable()
export class CiclosService {
  constructor(private prisma: PrismaAcademicService) { }

  create(data: Prisma.CicloCreateInput): Promise<Ciclo> {
    return this.prisma.ciclo.create({ data });
  }

  findAll(): Promise<Ciclo[]> {
    return this.prisma.ciclo.findMany({
      include: { estudiantes: true },
    });
  }

  findOne(id: number): Promise<Ciclo | null> {
    return this.prisma.ciclo.findUnique({
      where: { id },
      include: { estudiantes: true },
    });
  }

  update(id: number, data: Prisma.CicloUpdateInput): Promise<Ciclo> {
    return this.prisma.ciclo.update({
      where: { id },
      data,
    });
  }

  remove(id: number): Promise<Ciclo> {
    return this.prisma.ciclo.delete({
      where: { id },
    });
  }
}
