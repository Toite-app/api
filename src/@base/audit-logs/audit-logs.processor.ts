import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";

import { AuditLogsService } from "./audit-logs.service";
import { AuditLog } from "./schemas/audit-log.schema";
import { AUDIT_LOGS_QUEUE, AuditLogQueueJobName } from "./types";

@Processor(AUDIT_LOGS_QUEUE, {})
export class AuditLogsProcessor extends WorkerHost {
  private readonly logger = new Logger(AuditLogsProcessor.name);

  constructor(private readonly service: AuditLogsService) {
    super();
  }

  async process(job: Job) {
    const { name, data } = job;

    try {
      switch (name) {
        case AuditLogQueueJobName.CREATE_AUDIT_LOG: {
          await this.createAuditLog(data as Partial<AuditLog>);
          break;
        }

        default: {
          throw new Error(`Unknown job name: ${name}`);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to process ${name} job`, error);
      throw error;
    }
  }

  private async createAuditLog(payload: Partial<AuditLog>) {
    await this.service.create(payload);
  }
}
