import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { PrismaCicloCarreraService } from '../lib/prisma-ciclo-carrera.service';
import { PrismaProfesoresService } from '../lib/prisma-profesores.service';
import { SyncQueueService } from './sync-queue.service';

export interface CreateMateriaDto {
    nombre: string;
    codigo: string;
    docenteId: number;
    carreraId: number;
}

export interface UpdateMateriaDto {
    nombre?: string;
    codigo?: string;
    docenteId?: number;
    carreraId?: number;
}

/**
 * Materia Synchronization Service
 * Manages Materia entity across BD2 (Ciclo-Carrera) and BD3 (Profesores)
 * 
 * Strategy:
 * - BD2 is the master (has estudiantes, carrera)
 * - BD3 is the reference (has docente relation)
 * - Both must stay synchronized
 */
@Injectable()
export class MateriaSyncService {
    private readonly logger = new Logger(MateriaSyncService.name);

    constructor(
        private readonly cicloCarreraDb: PrismaCicloCarreraService,
        private readonly profesoresDb: PrismaProfesoresService,
        private readonly syncQueue: SyncQueueService,
    ) { }

    /**
     * Create materia in both databases
     */
    async create(data: CreateMateriaDto) {
        this.logger.log(`Creating materia: ${data.codigo}`);

        let materiaBD2 = null;
        let materiaBD3 = null;

        try {
            // Step 1: Create in BD2 (master with carrera)
            materiaBD2 = await this.cicloCarreraDb.executeWithCircuitBreaker(
                async () => {
                    return await this.cicloCarreraDb.materia.create({
                        data: {
                            nombre: data.nombre,
                            codigo: data.codigo,
                            docenteId: data.docenteId,
                            carreraId: data.carreraId,
                        },
                        include: {
                            carrera: true,
                            docente: true,
                        },
                    });
                },
                'create-materia-bd2',
            );

            this.logger.log(`✅ Materia created in BD2 with ID: ${materiaBD2.id}`);

            // Step 2: Create in BD3 (reference with same ID)
            try {
                materiaBD3 = await this.profesoresDb.executeWithCircuitBreaker(
                    async () => {
                        return await this.profesoresDb.materia.create({
                            data: {
                                id: materiaBD2.id, // Use same ID
                                nombre: data.nombre,
                                codigo: data.codigo,
                                docenteId: data.docenteId,
                            },
                            include: {
                                docente: true,
                            },
                        });
                    },
                    'create-materia-bd3',
                );

                this.logger.log(`✅ Materia created in BD3 with ID: ${materiaBD3.id}`);

                return materiaBD2;
            } catch (error) {
                // BD3 failed, rollback BD2
                this.logger.error(`❌ Failed to create in BD3, rolling back BD2: ${error.message}`);

                await this.rollbackCreateBD2(materiaBD2.id);

                // Queue operation for retry
                this.syncQueue.addToQueue({
                    type: 'create',
                    entity: 'materia',
                    database: 'profesores',
                    data: {
                        id: materiaBD2.id,
                        nombre: data.nombre,
                        codigo: data.codigo,
                        docenteId: data.docenteId,
                    },
                    maxAttempts: 5,
                });

                throw new InternalServerErrorException(
                    'Failed to create materia in professors database. Operation queued for retry.',
                );
            }
        } catch (error) {
            // BD2 failed initially
            if (!materiaBD2) {
                this.logger.error(`❌ Failed to create in BD2: ${error.message}`);

                // Queue operation for retry
                this.syncQueue.addToQueue({
                    type: 'create',
                    entity: 'materia',
                    database: 'ciclo-carrera',
                    data,
                    maxAttempts: 5,
                });

                throw new InternalServerErrorException(
                    'Academic database temporarily unavailable. Operation queued for retry.',
                );
            }

            throw error;
        }
    }

    /**
     * Get materia by ID
     */
    async findOne(id: number) {
        try {
            const materia = await this.cicloCarreraDb.executeWithCircuitBreaker(
                async () => {
                    return await this.cicloCarreraDb.materia.findUnique({
                        where: { id },
                        include: {
                            carrera: true,
                            docente: true,
                            estudiantes: true,
                        },
                    });
                },
                'find-materia',
            );

            return materia;
        } catch (error) {
            this.logger.error(`Failed to find materia: ${error.message}`);
            throw new InternalServerErrorException('Failed to retrieve materia');
        }
    }

    /**
     * List all materias
     */
    async findAll() {
        try {
            const materias = await this.cicloCarreraDb.executeWithCircuitBreaker(
                async () => {
                    return await this.cicloCarreraDb.materia.findMany({
                        include: {
                            carrera: true,
                            docente: true,
                            estudiantes: true,
                        },
                    });
                },
                'find-all-materias',
            );

            return materias;
        } catch (error) {
            this.logger.error(`Failed to list materias: ${error.message}`);
            throw new InternalServerErrorException('Failed to retrieve materias');
        }
    }

    /**
     * Update materia in both databases
     */
    async update(id: number, data: UpdateMateriaDto) {
        this.logger.log(`Updating materia ID: ${id}`);

        const updates: any = {};
        const updatesBD3: any = {};

        if (data.nombre !== undefined) {
            updates.nombre = data.nombre;
            updatesBD3.nombre = data.nombre;
        }
        if (data.codigo !== undefined) {
            updates.codigo = data.codigo;
            updatesBD3.codigo = data.codigo;
        }
        if (data.docenteId !== undefined) {
            updates.docenteId = data.docenteId;
            updatesBD3.docenteId = data.docenteId;
        }
        if (data.carreraId !== undefined) {
            updates.carreraId = data.carreraId;
        }

        let updatedBD2 = null;

        try {
            // Update BD2
            updatedBD2 = await this.cicloCarreraDb.executeWithCircuitBreaker(
                async () => {
                    return await this.cicloCarreraDb.materia.update({
                        where: { id },
                        data: updates,
                        include: {
                            carrera: true,
                            docente: true,
                        },
                    });
                },
                'update-materia-bd2',
            );

            // Update BD3
            if (Object.keys(updatesBD3).length > 0) {
                try {
                    await this.profesoresDb.executeWithCircuitBreaker(
                        async () => {
                            return await this.profesoresDb.materia.update({
                                where: { id },
                                data: updatesBD3,
                            });
                        },
                        'update-materia-bd3',
                    );
                } catch (error) {
                    this.logger.error(`Failed to update BD3, queueing: ${error.message}`);

                    this.syncQueue.addToQueue({
                        type: 'update',
                        entity: 'materia',
                        database: 'profesores',
                        data: { id, ...updatesBD3 },
                        maxAttempts: 5,
                    });
                }
            }

            return updatedBD2;
        } catch (error) {
            this.logger.error(`Failed to update materia: ${error.message}`);
            throw new InternalServerErrorException('Failed to update materia');
        }
    }

    /**
     * Delete materia from both databases
     */
    async remove(id: number) {
        this.logger.log(`Deleting materia ID: ${id}`);

        try {
            // Delete from BD2 first (master)
            await this.cicloCarreraDb.executeWithCircuitBreaker(
                async () => {
                    return await this.cicloCarreraDb.materia.delete({
                        where: { id },
                    });
                },
                'delete-materia-bd2',
            );

            // Then delete from BD3
            try {
                await this.profesoresDb.executeWithCircuitBreaker(
                    async () => {
                        return await this.profesoresDb.materia.delete({
                            where: { id },
                        });
                    },
                    'delete-materia-bd3',
                );
            } catch (error) {
                this.logger.error(`Failed to delete from BD3: ${error.message}`);
                // Queue for retry but don't fail the operation
                this.syncQueue.addToQueue({
                    type: 'delete',
                    entity: 'materia',
                    database: 'profesores',
                    data: { id },
                    maxAttempts: 5,
                });
            }

            this.logger.log(`✅ Materia deleted from both databases`);
            return { message: 'Materia deleted successfully' };
        } catch (error) {
            this.logger.error(`Failed to delete materia: ${error.message}`);
            throw error;
        }
    }

    /**
     * Assign students to materia (BD2 only)
     */
    async assignStudents(materiaId: number, estudianteIds: number[]) {
        this.logger.log(`Assigning ${estudianteIds.length} students to materia ${materiaId}`);

        try {
            const materia = await this.cicloCarreraDb.executeWithCircuitBreaker(
                async () => {
                    return await this.cicloCarreraDb.materia.update({
                        where: { id: materiaId },
                        data: {
                            estudiantes: {
                                connect: estudianteIds.map(id => ({ id })),
                            },
                        },
                        include: {
                            estudiantes: true,
                        },
                    });
                },
                'assign-students',
            );

            return materia;
        } catch (error) {
            this.logger.error(`Failed to assign students: ${error.message}`);
            throw new InternalServerErrorException('Failed to assign students');
        }
    }

    /**
     * Remove students from materia (BD2 only)
     */
    async removeStudents(materiaId: number, estudianteIds: number[]) {
        this.logger.log(`Removing ${estudianteIds.length} students from materia ${materiaId}`);

        try {
            const materia = await this.cicloCarreraDb.executeWithCircuitBreaker(
                async () => {
                    return await this.cicloCarreraDb.materia.update({
                        where: { id: materiaId },
                        data: {
                            estudiantes: {
                                disconnect: estudianteIds.map(id => ({ id })),
                            },
                        },
                        include: {
                            estudiantes: true,
                        },
                    });
                },
                'remove-students',
            );

            return materia;
        } catch (error) {
            this.logger.error(`Failed to remove students: ${error.message}`);
            throw new InternalServerErrorException('Failed to remove students');
        }
    }

    /**
     * Rollback BD2 creation
     */
    private async rollbackCreateBD2(id: number): Promise<void> {
        try {
            await this.cicloCarreraDb.materia.delete({ where: { id } });
            this.logger.log(`Rolled back BD2 creation for materia ID: ${id}`);
        } catch (error) {
            this.logger.error(`Failed to rollback BD2: ${error.message}`);
        }
    }
}
