import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient as AuthPrismaClient } from '../../generated/auth-client';
import { CircuitBreaker } from '../common/circuit-breaker';

/**
 * Independent Prisma Client for Authentication Database (BD1)
 * Handles: Usuario, Rol, Permiso
 * 
 * Features:
 * - Circuit breaker pattern for resilience
 * - Automatic reconnection with exponential backoff
 * - Health check capabilities
 * - Graceful error handling
 */
@Injectable()
export class PrismaAuthService extends AuthPrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaAuthService.name);
    private readonly circuitBreaker: CircuitBreaker;
    private isConnected = false;
    private reconnectAttempts = 0;
    private readonly maxReconnectAttempts = 5;

    constructor() {
        super({
            datasources: {
                db: {
                    url: process.env.AUTH_DATABASE_URL,
                },
            },
            log: [
                { level: 'warn', emit: 'event' },
                { level: 'error', emit: 'event' },
            ],
        });

        this.circuitBreaker = new CircuitBreaker({
            failureThreshold: 5,
            successThreshold: 2,
            timeout: 30000,
            resetTimeout: 60000,
        });

        this.$on('warn' as never, (e: any) => {
            this.logger.warn(`[AUTH DB] ${e.message}`);
        });

        this.$on('error' as never, (e: any) => {
            this.logger.error(`[AUTH DB] ${e.message}`);
        });
    }

    async onModuleInit() {
        await this.connect();
    }

    async onModuleDestroy() {
        await this.disconnect();
    }

    private async connect() {
        try {
            await this.circuitBreaker.execute(async () => {
                await this.$connect();
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.logger.log('✅ Connected to AUTH database');
            });
        } catch (error) {
            this.isConnected = false;
            this.logger.error(`❌ Failed to connect to AUTH database: ${error.message}`);
            await this.scheduleReconnect();
        }
    }

    private async disconnect() {
        try {
            await this.$disconnect();
            this.isConnected = false;
            this.logger.log('Disconnected from AUTH database');
        } catch (error) {
            this.logger.error(`Error disconnecting from AUTH database: ${error.message}`);
        }
    }

    private async scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.logger.error(`Max reconnection attempts reached for AUTH database`);
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

        this.logger.warn(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);

        setTimeout(async () => {
            await this.connect();
        }, delay);
    }

    /**
     * Execute a database operation with circuit breaker protection
     */
    async executeWithCircuitBreaker<T>(
        operation: () => Promise<T>,
        operationName: string,
    ): Promise<T> {
        try {
            return await this.circuitBreaker.execute(operation);
        } catch (error) {
            this.logger.error(`[AUTH DB] Operation "${operationName}" failed: ${error.message}`);

            // If connection lost, schedule reconnect
            if (this.isConnectionError(error)) {
                this.isConnected = false;
                await this.scheduleReconnect();
            }

            throw error;
        }
    }

    /**
     * Check if error is a connection error
     */
    private isConnectionError(error: any): boolean {
        const connectionErrors = [
            'ECONNREFUSED',
            'ETIMEDOUT',
            'ENOTFOUND',
            'Connection terminated',
            'Connection closed',
        ];

        return connectionErrors.some(msg => error.message?.includes(msg));
    }

    /**
     * Health check for this database
     */
    async healthCheck(): Promise<{ healthy: boolean; responseTime?: number; error?: string }> {
        const startTime = Date.now();

        try {
            // Simple query to check connection
            await this.$queryRaw`SELECT 1`;
            const responseTime = Date.now() - startTime;

            return {
                healthy: true,
                responseTime,
            };
        } catch (error) {
            return {
                healthy: false,
                error: error.message,
            };
        }
    }

    /**
     * Get circuit breaker status
     */
    getCircuitBreakerStatus() {
        return {
            ...this.circuitBreaker.getMetrics(),
            isConnected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
        };
    }

    /**
     * Reset circuit breaker (for admin use)
     */
    resetCircuitBreaker() {
        this.circuitBreaker.reset();
        this.reconnectAttempts = 0;
        this.logger.log('Circuit breaker reset for AUTH database');
    }
}
