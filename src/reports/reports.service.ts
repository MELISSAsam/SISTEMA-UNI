import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaAcademicService } from '../prisma/prisma-academic.service';
import { PrismaProfilesService } from '../prisma/prisma-profiles.service';

@Injectable()
export class ReportsService {
    constructor(
        private prismaAcademic: PrismaAcademicService,
        private prismaProfiles: PrismaProfilesService,
    ) { }

    // --- PARTE 1: Consultas Derivadas ---

    async listarEstudiantesActivos() {
        return this.prismaAcademic.estudiante.findMany({
            where: { estado: 'ACTIVO' },
            include: { carrera: true },
        });
    }

    async obtenerMateriasPorCarrera(carreraId: number) {
        return this.prismaAcademic.materia.findMany({
            where: { carreraId },
            include: { carrera: true },
        });
    }

    async listarDocentesMultiAsignatura() {
        // En BD Academic los docentes tienen sus materias
        return this.prismaAcademic.docente.findMany({
            where: {
                materias: {
                    some: {}, // Filtro inicial
                },
            },
            include: {
                _count: {
                    select: { materias: true },
                },
            },
        }).then(docentes => docentes.filter(d => d._count.materias > 1));
    }

    async mostrarMatriculasPorPeriodo(estudianteId: number, cicloId: number) {
        // Asumiendo que las materias del estudiante corresponden a su ciclo actual
        // O filtrando si existiera una tabla intermedia con periodo
        return this.prismaAcademic.estudiante.findUnique({
            where: { id: estudianteId },
            include: {
                materias: true,
                ciclo: true,
            },
        });
    }

    // --- PARTE 2: Operaciones Lógicas ---

    async buscarEstudiantesAvanzados(carreraId: number, cicloId: number) {
        return this.prismaAcademic.estudiante.findMany({
            where: {
                AND: [
                    { estado: 'ACTIVO' },
                    { carreraId: carreraId },
                    { cicloId: cicloId }, // "Matrícula en un período" (ciclo)
                    { materias: { some: {} } } // Tiene materias inscritas
                ]
            }
        });
    }

    async filtrarDocentesComplejos() {
        return this.prismaAcademic.docente.findMany({
            where: {
                AND: [
                    { tipoContrato: 'TIEMPO_COMPLETO' },
                    {
                        OR: [
                            { materias: { some: {} } }, // Dicten asignaturas
                            { NOT: { estado: 'INACTIVO' } } // No estén inactivos
                        ]
                    }
                ]
            }
        });
    }

    // --- PARTE 3: Consulta Nativa ---

    async reporteMatriculasNativo() {
        const query = `
      SELECT 
        e.nombre as "Nombre Estudiante",
        c.nombre as "Carrera",
        COUNT(m."B") as "Total Materias"
      FROM estudiantes e
      JOIN carreras c ON e."carreraId" = c.id
      LEFT JOIN "_Inscripciones" m ON m."A" = e.id
      GROUP BY e.id, e.nombre, c.nombre
      ORDER BY "Total Materias" DESC
    `;
        // Nota: _Inscripciones es la tabla generada por Prisma para M-N implícita
        // "A" suele ser Estudiante, "B" Materia (depende del orden alfabético o definición)
        // Verificaremos si esto funciona, si no ajustaremos.
        return this.prismaAcademic.$queryRawUnsafe(query);
    }

    // --- PARTE 4: Operación Transaccional ---

    async matricularEstudiante(estudianteId: number, materiaId: number) {
        return this.prismaAcademic.$transaction(async (tx) => {
            // 1. Verificar estudiante activo
            const estudiante = await tx.estudiante.findUnique({
                where: { id: estudianteId },
            });

            if (!estudiante || estudiante.estado !== 'ACTIVO') {
                throw new BadRequestException('El estudiante no existe o no está activo');
            }

            // 2. Verificar disponibilidad de cupos
            const materia = await tx.materia.findUnique({
                where: { id: materiaId },
            });

            if (!materia) {
                throw new BadRequestException('La materia no existe');
            }

            if (materia.cupos <= 0) {
                throw new BadRequestException('No hay cupos disponibles en esta materia');
            }

            // 3. Registrar matrícula (Relación M-N)
            // Primero verificamos si ya está inscrito
            const yaInscrito = await tx.estudiante.findFirst({
                where: {
                    id: estudianteId,
                    materias: { some: { id: materiaId } }
                }
            });

            if (yaInscrito) {
                throw new BadRequestException('El estudiante ya está inscrito en esta materia');
            }

            await tx.estudiante.update({
                where: { id: estudianteId },
                data: {
                    materias: {
                        connect: { id: materiaId }
                    }
                }
            });

            // 4. Descontar cupo
            await tx.materia.update({
                where: { id: materiaId },
                data: {
                    cupos: { decrement: 1 }
                }
            });

            return {
                mensaje: 'Matrícula exitosa',
                estudiante: estudiante.nombre,
                materia: materia.nombre,
                cuposRestantes: materia.cupos - 1
            };
        }).catch((error) => {
            // Revert se hace automático al lanzar error
            throw new InternalServerErrorException(error.message);
        });
    }
}
