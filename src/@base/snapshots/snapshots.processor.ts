import { CrudAction } from "@core/types/general";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Job } from "bullmq";
import { Model } from "mongoose";
import {
  Snapshot,
  SnapshotDocument,
} from "src/@base/snapshots/schemas/snapshot.schema";
import { SnapshotsService } from "src/@base/snapshots/snapshots.service";
import {
  CreateSnapshotPayload,
  SnapshotQueueJobName,
  SNAPSHOTS_QUEUE,
} from "src/@base/snapshots/types";

@Processor(SNAPSHOTS_QUEUE, {})
export class SnapshotsProcessor extends WorkerHost {
  private readonly logger = new Logger(SnapshotsProcessor.name);

  constructor(
    private readonly service: SnapshotsService,
    @InjectModel(Snapshot.name)
    private readonly snapshotModel: Model<SnapshotDocument>,
  ) {
    super();
  }

  async process(job: Job) {
    const { name, data } = job;

    try {
      switch (name) {
        case SnapshotQueueJobName.CREATE_SNAPSHOT: {
          await this.createSnapshot(data as CreateSnapshotPayload);
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

  private async createSnapshot(payload: CreateSnapshotPayload) {
    const { model, data, documentId, workerId } = payload;

    const worker = await this.service.getWorker(workerId);
    const previous = await this.service.getPreviousSnapshot(documentId, model);
    const action = this.service.determinateAction(payload, previous);

    const changes =
      action === CrudAction.UPDATE
        ? this.service.calculateChanges(previous?.data ?? null, data)
        : [];

    const snapshot = await this.snapshotModel.create({
      model,
      action,
      documentId,
      data,
      changes,
      workerId: workerId ?? null,
      worker,
    });

    await snapshot.save();
  }
}
