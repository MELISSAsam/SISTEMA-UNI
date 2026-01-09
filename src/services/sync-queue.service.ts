import { Injectable, Logger } from '@nestjs/common';

export interface PendingOperation {
    id: string;
    type: 'create' | 'update' | 'delete';
    entity: 'docente' | 'materia';
    database: 'ciclo-carrera' | 'profesores';
    data: any;
    attempts: number;
    maxAttempts: number;
    createdAt: Date;
    lastAttempt?: Date;
    error?: string;
}

/**
 * Queue Service for Failed Synchronization Operations
 * Stores and retries operations when databases recover
 */
@Injectable()
export class SyncQueueService {
    private readonly logger = new Logger(SyncQueueService.name);
    private queue: Map<string, PendingOperation> = new Map();
    private retryInterval: NodeJS.Timeout;

    constructor() {
        this.startRetryInterval();
    }

    /**
     * Add operation to queue
     */
    addToQueue(operation: Omit<PendingOperation, 'id' | 'attempts' | 'createdAt'>): string {
        const id = this.generateId();
        const pendingOp: PendingOperation = {
            ...operation,
            id,
            attempts: 0,
            createdAt: new Date(),
        };

        this.queue.set(id, pendingOp);
        this.logger.warn(
            `Operation queued: ${operation.type} ${operation.entity} in ${operation.database} (ID: ${id})`,
        );

        return id;
    }

    /**
     * Get all pending operations
     */
    getPendingOperations(): PendingOperation[] {
        return Array.from(this.queue.values());
    }

    /**
     * Get pending operations for specific entity
     */
    getPendingOperationsForEntity(entity: 'docente' | 'materia'): PendingOperation[] {
        return Array.from(this.queue.values()).filter(op => op.entity === entity);
    }

    /**
     * Get pending operations for specific database
     */
    getPendingOperationsForDatabase(database: 'ciclo-carrera' | 'profesores'): PendingOperation[] {
        return Array.from(this.queue.values()).filter(op => op.database === database);
    }

    /**
     * Mark operation as completed
     */
    completeOperation(id: string): void {
        const operation = this.queue.get(id);
        if (operation) {
            this.queue.delete(id);
            this.logger.log(`✅ Operation completed: ${operation.type} ${operation.entity} (ID: ${id})`);
        }
    }

    /**
     * Mark operation as failed
     */
    failOperation(id: string, error: string): void {
        const operation = this.queue.get(id);
        if (!operation) return;

        operation.attempts++;
        operation.lastAttempt = new Date();
        operation.error = error;

        if (operation.attempts >= operation.maxAttempts) {
            this.logger.error(
                `❌ Operation failed permanently after ${operation.attempts} attempts: ${operation.type} ${operation.entity} (ID: ${id})`,
            );
            this.logger.error(`Error: ${error}`);
            // Keep in queue for manual review but mark as permanently failed
        } else {
            this.logger.warn(
                `Retry ${operation.attempts}/${operation.maxAttempts} failed for: ${operation.type} ${operation.entity} (ID: ${id})`,
            );
        }
    }

    /**
     * Retry pending operations (called by interval or manually)
     */
    async retryPendingOperations(
        retryCallback: (operation: PendingOperation) => Promise<boolean>,
    ): Promise<void> {
        const pending = this.getPendingOperations();

        if (pending.length === 0) return;

        this.logger.log(`Retrying ${pending.length} pending operations...`);

        for (const operation of pending) {
            // Skip if max attempts reached
            if (operation.attempts >= operation.maxAttempts) {
                continue;
            }

            // Exponential backoff
            const backoffDelay = Math.min(
                1000 * Math.pow(2, operation.attempts),
                30000,
            );

            const timeSinceLastAttempt = operation.lastAttempt
                ? Date.now() - operation.lastAttempt.getTime()
                : Infinity;

            if (timeSinceLastAttempt < backoffDelay) {
                continue; // Not ready to retry yet
            }

            try {
                const success = await retryCallback(operation);
                if (success) {
                    this.completeOperation(operation.id);
                } else {
                    this.failOperation(operation.id, 'Retry callback returned false');
                }
            } catch (error) {
                this.failOperation(operation.id, error.message);
            }
        }
    }

    /**
     * Clear all completed operations
     */
    clearCompleted(): void {
        const initialSize = this.queue.size;
        // In this implementation, completed operations are already removed
        // This method is for future use if we want to keep completed operations
        this.logger.log(`Queue size: ${this.queue.size} (was ${initialSize})`);
    }

    /**
     * Get queue statistics
     */
    getStatistics() {
        const operations = this.getPendingOperations();

        return {
            total: operations.length,
            byEntity: {
                docente: operations.filter(op => op.entity === 'docente').length,
                materia: operations.filter(op => op.entity === 'materia').length,
            },
            byDatabase: {
                cicloCarrera: operations.filter(op => op.database === 'ciclo-carrera').length,
                profesores: operations.filter(op => op.database === 'profesores').length,
            },
            byType: {
                create: operations.filter(op => op.type === 'create').length,
                update: operations.filter(op => op.type === 'update').length,
                delete: operations.filter(op => op.type === 'delete').length,
            },
            failed: operations.filter(op => op.attempts >= op.maxAttempts).length,
        };
    }

    /**
     * Start automatic retry interval
     */
    private startRetryInterval(): void {
        // This will be triggered by the sync services
        // We don't auto-retry here to avoid coupling
        this.logger.log('Sync queue service initialized');
    }

    /**
     * Generate unique ID for operation
     */
    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Remove operation from queue (admin function)
     */
    removeOperation(id: string): boolean {
        return this.queue.delete(id);
    }

    /**
     * Clear entire queue (admin function - use with caution)
     */
    clearQueue(): void {
        const size = this.queue.size;
        this.queue.clear();
        this.logger.warn(`Queue cleared: ${size} operations removed`);
    }
}
