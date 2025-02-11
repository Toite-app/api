import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { AuditLogsInterceptor } from "./audit-logs.interceptor";
import { AuditLogsService } from "./audit-logs.service";
import { AuditLog, AuditLogSchema } from "./schemas/audit-log.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  controllers: [],
  providers: [AuditLogsService, AuditLogsInterceptor],
  exports: [AuditLogsService],
})
export class AuditLogsModule {}
