import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { JobsOptions, Queue } from "bullmq";
import {
  CreateSnapshotPayload,
  SnapshotQueueJobName,
  SNAPSHOTS_QUEUE,
} from "src/@base/snapshots/types";

@Injectable()
export class SnapshotsProducer {
  private readonly logger = new Logger(SnapshotsProducer.name);

  constructor(
    @InjectQueue(SNAPSHOTS_QUEUE)
    private readonly queue: Queue,
  ) {}

  private async addJob(
    name: SnapshotQueueJobName,
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
   * Creates a task to create a snapshot
   */
  public async create(payload: CreateSnapshotPayload) {
    return this.addJob(SnapshotQueueJobName.CREATE_SNAPSHOT, payload);
  }
}
