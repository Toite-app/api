import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { AuditLogsInterceptor } from "./audit-logs.interceptor";
import { AuditLogsProcessor } from "./audit-logs.processor";
import { AuditLogsProducer } from "./audit-logs.producer";
import { AuditLogsService } from "./audit-logs.service";
import { AuditLog, AuditLogSchema } from "./schemas/audit-log.schema";
import { AUDIT_LOGS_QUEUE } from "./types";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
    BullModule.registerQueue({
      name: AUDIT_LOGS_QUEUE,
    }),
  ],
  controllers: [],
  providers: [
    AuditLogsService,
    AuditLogsInterceptor,
    AuditLogsProcessor,
    AuditLogsProducer,
  ],
  exports: [AuditLogsProducer],
})
export class AuditLogsModule {}
