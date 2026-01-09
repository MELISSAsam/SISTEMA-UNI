import { Controller, Get } from '@nestjs/common';
import { DatabaseHealthService } from '../lib/database-health.service';
import { SyncQueueService } from '../services/sync-queue.service';

/**
 * Health Check Controller
 * Provides endpoints for monitoring database and service health
 */
@Controller('health')
export class HealthController {
    constructor(
        private readonly healthService: DatabaseHealthService,
        private readonly syncQueue: SyncQueueService,
    ) { }

    /**
     * GET /health
     * Returns overall system health status
     */
    @Get()
    async getHealth() {
        return await this.healthService.checkHealth();
    }

    /**
     * GET /health/databases
     * Returns detailed database health information
     */
    @Get('databases')
    async getDatabaseHealth() {
        const health = await this.healthService.checkHealth();
        return {
            timestamp: health.timestamp,
            databases: health.databases,
        };
    }

    /**
     * GET /health/circuit-breakers
     * Returns circuit breaker status for all databases
     */
    @Get('circuit-breakers')
    getCircuitBreakers() {
        return this.healthService.getCircuitBreakerStatus();
    }

    /**
     * GET /health/sync-queue
     * Returns synchronization queue statistics
     */
    @Get('sync-queue')
    getSyncQueue() {
        return {
            statistics: this.syncQueue.getStatistics(),
            pending: this.syncQueue.getPendingOperations(),
        };
    }
}
