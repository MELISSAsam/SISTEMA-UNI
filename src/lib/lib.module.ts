import { Module, Global } from '@nestjs/common';
import { PrismaAuthService } from './prisma-auth.service';
import { PrismaCicloCarreraService } from './prisma-ciclo-carrera.service';
import { PrismaProfesoresService } from './prisma-profesores.service';
import { DatabaseHealthService } from './database-health.service';

/**
 * Global module that provides all 3 independent Prisma clients
 * and database health monitoring service
 */
@Global()
@Module({
    providers: [
        PrismaAuthService,
        PrismaCicloCarreraService,
        PrismaProfesoresService,
        DatabaseHealthService,
    ],
    exports: [
        PrismaAuthService,
        PrismaCicloCarreraService,
        PrismaProfesoresService,
        DatabaseHealthService,
    ],
})
export class LibModule { }
