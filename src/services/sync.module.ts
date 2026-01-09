import { Module } from '@nestjs/common';
import { DocenteSyncService } from './docente-sync.service';
import { MateriaSyncService } from './materia-sync.service';
import { SyncQueueService } from './sync-queue.service';

/**
 * Module for cross-database synchronization services
 */
@Module({
    providers: [
        SyncQueueService,
        DocenteSyncService,
        MateriaSyncService,
    ],
    exports: [
        SyncQueueService,
        DocenteSyncService,
        MateriaSyncService,
    ],
})
export class SyncModule { }
