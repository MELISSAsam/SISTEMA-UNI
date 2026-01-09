import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaCicloCarreraService } from '../lib/prisma-ciclo-carrera.service';
import { PrismaProfesoresService } from '../lib/prisma-profesores.service';
import { SyncQueueService } from './sync-queue.service';

export interface CreateDocenteDto {
    nombre: string;
    email: string;
    especialidadId: number;
    carreraId: number;
}

export interface UpdateDocenteDto {
    nombre?: string;
    email?: string;
    especialidadId?: number;
    carreraId?: number;
}

/**
 * Docente Synchronization Service
 * Manages Docente entity across BD2 (Ciclo-Carrera) and BD3 (Profesores)
 * 
 * Strategy:
 * - BD3 is the master (has especialidad)
 * - BD2 is the reference (has carrera)
 * - Both must stay synchronized
 */
@Injectable()
export class DocenteSyncService {
    private readonly logger = new Logger(DocenteSyncService.name);

    constructor(
        private readonly cicloCarreraDb: PrismaCicloCarreraService,
        private readonly profesoresDb: PrismaProfesoresService,
        private readonly syncQueue: SyncQueueService,
    ) { }

    /**
     * Create docente in both databases
     */
    async create(data: CreateDocenteDto) {
        this.logger.log(`Creating docente: ${data.email}`);

        let docenteBD3 = null;
        let docenteBD2 = null;

        try {
            // Step 1: Create in BD3 (master with especialidad)
            docenteBD3 = await this.profesoresDb.executeWithCircuitBreaker(
                async () => {
                    return await this.profesoresDb.docente.create({
                        data: {
                            nombre: data.nombre,
                            email: data.email,
                            especialidadId: data.especialidadId,
                            carreraId: data.carreraId,
                        },
                        include: {
                            especialidad: true,
                        },
                    });
                },
                'create-docente-bd3',
            );

            this.logger.log(`✅ Docente created in BD3 with ID: ${docenteBD3.id}`);

            // Step 2: Create in BD2 (reference with same ID and carrera)
            try {
                docenteBD2 = await this.cicloCarreraDb.executeWithCircuitBreaker(
                    async () => {
                        return await this.cicloCarreraDb.docente.create({
                            data: {
                                id: docenteBD3.id, // Use same ID
                                nombre: data.nombre,
                                email: data.email,
                                carreraId: data.carreraId,
                            },
                            include: {
                                carrera: true,
                            },
                        });
                    },
                    'create-docente-bd2',
                );

                this.logger.log(`✅ Docente created in BD2 with ID: ${docenteBD2.id}`);

                // Success! Return combined data
                return {
                    id: docenteBD3.id,
                    nombre: docenteBD3.nombre,
                    email: docenteBD3.email,
                    especialidadId: docenteBD3.especialidadId,
                    especialidad: docenteBD3.especialidad,
                    carreraId: docenteBD2.carreraId,
                    carrera: docenteBD2.carrera,
                };
            } catch (error) {
                // BD2 failed, rollback BD3
                this.logger.error(`❌ Failed to create in BD2, rolling back BD3: ${error.message}`);

                await this.rollbackCreateBD3(docenteBD3.id);

                // Queue operation for retry
                this.syncQueue.addToQueue({
                    type: 'create',
                    entity: 'docente',
                    database: 'ciclo-carrera',
                    data: {
                        id: docenteBD3.id,
                        nombre: data.nombre,
                        email: data.email,
                        carreraId: data.carreraId,
                    },
                    maxAttempts: 5,
                });

                throw new InternalServerErrorException(
                    'Failed to create docente in academic database. Operation queued for retry.',
                );
            }
        } catch (error) {
            // BD3 failed initially
            if (!docenteBD3) {
                this.logger.error(`❌ Failed to create in BD3: ${error.message}`);

                // Queue operation for retry
                this.syncQueue.addToQueue({
                    type: 'create',
                    entity: 'docente',
                    database: 'profesores',
                    data,
                    maxAttempts: 5,
                });

                throw new InternalServerErrorException(
                    'Professors database temporarily unavailable. Operation queued for retry.',
                );
            }

            throw error;
        }
    }

    /**
     * Get docente by ID (from BD3 with BD2 data)
     */
    async findOne(id: number) {
        try {
            // Get from BD3 (master)
            const docenteBD3 = await this.profesoresDb.executeWithCircuitBreaker(
                async () => {
                    return await this.profesoresDb.docente.findUnique({
                        where: { id },
                        include: { especialidad: true },
                    });
                },
                'find-docente-bd3',
            );

            if (!docenteBD3) {
                return null;
            }

            // Try to get carrera from BD2
            let carrera = null;
            try {
                const docenteBD2 = await this.cicloCarreraDb.executeWithCircuitBreaker(
                    async () => {
                        return await this.cicloCarreraDb.docente.findUnique({
                            where: { id },
                            include: { carrera: true },
                        });
                    },
                    'find-docente-bd2',
                );

                carrera = docenteBD2?.carrera;
            } catch (error) {
                this.logger.warn(`Could not fetch carrera from BD2: ${error.message}`);
            }

            return {
                ...docenteBD3,
                carrera,
            };
        } catch (error) {
            this.logger.error(`Failed to find docente: ${error.message}`);
            throw new InternalServerErrorException('Failed to retrieve docente');
        }
    }

    /**
     * List all docentes
     */
    async findAll() {
        try {
            const docentesBD3 = await this.profesoresDb.executeWithCircuitBreaker(
                async () => {
                    return await this.profesoresDb.docente.findMany({
                        include: { especialidad: true },
                    });
                },
                'find-all-docentes-bd3',
            );

            // Try to enrich with carrera data from BD2
            try {
                const docentesBD2 = await this.cicloCarreraDb.executeWithCircuitBreaker(
                    async () => {
                        return await this.cicloCarreraDb.docente.findMany({
                            include: { carrera: true },
                        });
                    },
                    'find-all-docentes-bd2',
                );

                // Merge data
                const bd2Map = new Map(docentesBD2.map(d => [d.id, d]));

                return docentesBD3.map(d3 => ({
                    ...d3,
                    carrera: bd2Map.get(d3.id)?.carrera || null,
                }));
            } catch (error) {
                this.logger.warn(`Could not fetch carreras from BD2: ${error.message}`);
                return docentesBD3;
            }
        } catch (error) {
            this.logger.error(`Failed to list docentes: ${error.message}`);
            throw new InternalServerErrorException('Failed to retrieve docentes');
        }
    }

    /**
     * Update docente in both databases
     */
    async update(id: number, data: UpdateDocenteDto) {
        this.logger.log(`Updating docente ID: ${id}`);

        const updates: any = {};
        const updatesBD2: any = {};

        if (data.nombre !== undefined) {
            updates.nombre = data.nombre;
            updatesBD2.nombre = data.nombre;
        }
        if (data.email !== undefined) {
            updates.email = data.email;
            updatesBD2.email = data.email;
        }
        if (data.especialidadId !== undefined) {
            updates.especialidadId = data.especialidadId;
        }
        if (data.carreraId !== undefined) {
            updates.carreraId = data.carreraId;
            updatesBD2.carreraId = data.carreraId;
        }

        let updatedBD3 = null;

        try {
            // Update BD3
            updatedBD3 = await this.profesoresDb.executeWithCircuitBreaker(
                async () => {
                    return await this.profesoresDb.docente.update({
                        where: { id },
                        data: updates,
                        include: { especialidad: true },
                    });
                },
                'update-docente-bd3',
            );

            // Update BD2
            if (Object.keys(updatesBD2).length > 0) {
                try {
                    await this.cicloCarreraDb.executeWithCircuitBreaker(
                        async () => {
                            return await this.cicloCarreraDb.docente.update({
                                where: { id },
                                data: updatesBD2,
                            });
                        },
                        'update-docente-bd2',
                    );
                } catch (error) {
                    this.logger.error(`Failed to update BD2, queueing: ${error.message}`);

                    this.syncQueue.addToQueue({
                        type: 'update',
                        entity: 'docente',
                        database: 'ciclo-carrera',
                        data: { id, ...updatesBD2 },
                        maxAttempts: 5,
                    });
                }
            }

            return updatedBD3;
        } catch (error) {
            this.logger.error(`Failed to update docente: ${error.message}`);
            throw new InternalServerErrorException('Failed to update docente');
        }
    }

    /**
     * Delete docente from both databases
     */
    async remove(id: number) {
        this.logger.log(`Deleting docente ID: ${id}`);

        try {
            // First delete from BD2 (has foreign keys to materias)
            try {
                await this.cicloCarreraDb.executeWithCircuitBreaker(
                    async () => {
                        return await this.cicloCarreraDb.docente.delete({
                            where: { id },
                        });
                    },
                    'delete-docente-bd2',
                );
            } catch (error) {
                this.logger.error(`Failed to delete from BD2: ${error.message}`);
                throw new BadRequestException('Cannot delete docente with assigned courses');
            }

            // Then delete from BD3
            await this.profesoresDb.executeWithCircuitBreaker(
                async () => {
                    return await this.profesoresDb.docente.delete({
                        where: { id },
                    });
                },
                'delete-docente-bd3',
            );

            this.logger.log(`✅ Docente deleted from both databases`);
            return { message: 'Docente deleted successfully' };
        } catch (error) {
            this.logger.error(`Failed to delete docente: ${error.message}`);
            throw error;
        }
    }

    /**
     * Rollback BD3 creation
     */
    private async rollbackCreateBD3(id: number): Promise<void> {
        try {
            await this.profesoresDb.docente.delete({ where: { id } });
            this.logger.log(`Rolled back BD3 creation for docente ID: ${id}`);
        } catch (error) {
            this.logger.error(`Failed to rollback BD3: ${error.message}`);
        }
    }
}
