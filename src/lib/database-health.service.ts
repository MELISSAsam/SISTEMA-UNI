import { Injectable, Logger } from '@nestjs/common';
import { PrismaAuthService } from './prisma-auth.service';
import { PrismaCicloCarreraService } from './prisma-ciclo-carrera.service';
import { PrismaProfesoresService } from './prisma-profesores.service';

export interface DatabaseStatus {
    healthy: boolean;
    responseTime?: number;
    error?: string;
    lastCheck: string;
}

export interface HealthCheckResponse {
    status: 'healthy' | 'degraded' | 'down';
    timestamp: string;
    databases: {
        auth: DatabaseStatus;
        cicloCarrera: DatabaseStatus;
        profesores: DatabaseStatus;
    };
    services: {
        auth: 'available' | 'unavailable';
        estudiantes: 'available' | 'degraded' | 'unavailable';
        docentes: 'available' | 'degraded' | 'unavailable';
        materias: 'available' | 'degraded' | 'unavailable';
        carreras: 'available' | 'unavailable';
        ciclos: 'available' | 'unavailable';
        especialidades: 'available' | 'unavailable';
    };
}

/**
 * Centralized Database Health Monitoring Service
 * Monitors all 3 databases and provides health status
 */
@Injectable()
export class DatabaseHealthService {
    private readonly logger = new Logger(DatabaseHealthService.name);
    private healthCheckInterval: NodeJS.Timeout;
    private lastHealthCheck: HealthCheckResponse;

    constructor(
        private readonly authDb: PrismaAuthService,
        private readonly cicloCarreraDb: PrismaCicloCarreraService,
        private readonly profesoresDb: PrismaProfesoresService,
    ) {
        // Start periodic health checks
        this.startHealthCheckInterval();
    }

    /**
     * Perform health check on all databases
     */
    async checkHealth(): Promise<HealthCheckResponse> {
        const timestamp = new Date().toISOString();

        // Check all 3 databases in parallel
        const [authHealth, cicloCarreraHealth, profesoresHealth] = await Promise.all([
            this.authDb.healthCheck(),
            this.cicloCarreraDb.healthCheck(),
            this.profesoresDb.healthCheck(),
        ]);

        const databases = {
            auth: {
                ...authHealth,
                lastCheck: timestamp,
            },
            cicloCarrera: {
                ...cicloCarreraHealth,
                lastCheck: timestamp,
            },
            profesores: {
                ...profesoresHealth,
                lastCheck: timestamp,
            },
        };

        // Determine overall status
        const healthyCount = [authHealth, cicloCarreraHealth, profesoresHealth].filter(
            h => h.healthy,
        ).length;

        let overallStatus: 'healthy' | 'degraded' | 'down';
        if (healthyCount === 3) {
            overallStatus = 'healthy';
        } else if (healthyCount === 0) {
            overallStatus = 'down';
        } else {
            overallStatus = 'degraded';
        }

        // Determine service availability
        const services = {
            auth: authHealth.healthy ? 'available' : 'unavailable',
            estudiantes: cicloCarreraHealth.healthy ? 'available' : 'unavailable',
            carreras: cicloCarreraHealth.healthy ? 'available' : 'unavailable',
            ciclos: cicloCarreraHealth.healthy ? 'available' : 'unavailable',
            especialidades: profesoresHealth.healthy ? 'available' : 'unavailable',
            // Docentes and Materias require both BD2 and BD3
            docentes: this.getServiceStatus(cicloCarreraHealth.healthy, profesoresHealth.healthy),
            materias: this.getServiceStatus(cicloCarreraHealth.healthy, profesoresHealth.healthy),
        } as HealthCheckResponse['services'];

        const response: HealthCheckResponse = {
            status: overallStatus,
            timestamp,
            databases,
            services,
        };

        // Log status changes
        if (this.lastHealthCheck) {
            this.logStatusChanges(this.lastHealthCheck, response);
        }

        this.lastHealthCheck = response;
        return response;
    }

    /**
     * Get service status based on required databases
     */
    private getServiceStatus(
        db1Healthy: boolean,
        db2Healthy: boolean,
    ): 'available' | 'degraded' | 'unavailable' {
        if (db1Healthy && db2Healthy) return 'available';
        if (!db1Healthy && !db2Healthy) return 'unavailable';
        return 'degraded';
    }

    /**
     * Log changes in database status
     */
    private logStatusChanges(
        previous: HealthCheckResponse,
        current: HealthCheckResponse,
    ): void {
        // Check AUTH database
        if (previous.databases.auth.healthy !== current.databases.auth.healthy) {
            if (current.databases.auth.healthy) {
                this.logger.log('✅ AUTH database recovered');
            } else {
                this.logger.error(`❌ AUTH database down: ${current.databases.auth.error}`);
            }
        }

        // Check CICLO-CARRERA database
        if (previous.databases.cicloCarrera.healthy !== current.databases.cicloCarrera.healthy) {
            if (current.databases.cicloCarrera.healthy) {
                this.logger.log('✅ CICLO-CARRERA database recovered');
            } else {
                this.logger.error(`❌ CICLO-CARRERA database down: ${current.databases.cicloCarrera.error}`);
            }
        }

        // Check PROFESORES database
        if (previous.databases.profesores.healthy !== current.databases.profesores.healthy) {
            if (current.databases.profesores.healthy) {
                this.logger.log('✅ PROFESORES database recovered');
            } else {
                this.logger.error(`❌ PROFESORES database down: ${current.databases.profesores.error}`);
            }
        }
    }

    /**
     * Start periodic health checks
     */
    private startHealthCheckInterval(): void {
        const interval = 30000; // 30 seconds

        this.healthCheckInterval = setInterval(async () => {
            try {
                await this.checkHealth();
            } catch (error) {
                this.logger.error(`Health check failed: ${error.message}`);
            }
        }, interval);

        this.logger.log(`Health check interval started (every ${interval}ms)`);
    }

    /**
     * Stop health check interval (for cleanup)
     */
    stopHealthCheckInterval(): void {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.logger.log('Health check interval stopped');
        }
    }

    /**
     * Get circuit breaker status for all databases
     */
    getCircuitBreakerStatus() {
        return {
            auth: this.authDb.getCircuitBreakerStatus(),
            cicloCarrera: this.cicloCarreraDb.getCircuitBreakerStatus(),
            profesores: this.profesoresDb.getCircuitBreakerStatus(),
        };
    }

    /**
     * Reset all circuit breakers (admin function)
     */
    resetAllCircuitBreakers(): void {
        this.authDb.resetCircuitBreaker();
        this.cicloCarreraDb.resetCircuitBreaker();
        this.profesoresDb.resetCircuitBreaker();
        this.logger.log('All circuit breakers reset');
    }

    /**
     * Get last health check result (cached)
     */
    getLastHealthCheck(): HealthCheckResponse | null {
        return this.lastHealthCheck || null;
    }
}
