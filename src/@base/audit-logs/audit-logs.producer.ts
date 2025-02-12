import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { JobsOptions, Queue } from "bullmq";

import { AuditLog } from "./schemas/audit-log.schema";
import { AUDIT_LOGS_QUEUE, AuditLogQueueJobName } from "./types";

@Injectable()
export class AuditLogsProducer {
  private readonly logger = new Logger(AuditLogsProducer.name);

  constructor(
    @InjectQueue(AUDIT_LOGS_QUEUE)
    private readonly queue: Queue,
  ) {}

  private async addJob(
    name: AuditLogQueueJobName,
    data: any,
    opts?: JobsOptions,
  ) {
    try {
      return await this.queue.add(name, data, opts);
    } catch (error) {
      this.logger.error(`Failed to add ${name} job to queue:`, error);
      throw error;
    }
  }

  /**
   * Creates a task to create an audit log
   */
  public async create(payload: Partial<AuditLog>) {
    return this.addJob(AuditLogQueueJobName.CREATE_AUDIT_LOG, payload);
  }
}
