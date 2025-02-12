import { CrudAction } from "@core/types/general";
import { Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { schema } from "@postgress-db/drizzle.module";
import { eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Model } from "mongoose";
import { CreateSnapshotPayload } from "src/@base/snapshots/types";
import { PG_CONNECTION } from "src/constants";

import { Snapshot, SnapshotDocument } from "./schemas/snapshot.schema";

@Injectable()
export class SnapshotsService {
  constructor(
    @InjectModel(Snapshot.name)
    private readonly snapshotModel: Model<SnapshotDocument>,
    @Inject(PG_CONNECTION) private readonly pg: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Determines the action to be taken based on the payload
   * @param payload Payload to determine the action
   * @returns Action to be taken
   */
  private async determinateAction(payload: CreateSnapshotPayload) {
    const { documentId, model, data } = payload;

    if (payload.action) return payload.action;
    if (data === null) return CrudAction.DELETE;

    const document = await this.snapshotModel.findOne({
      documentId,
      model,
    });

    if (document) return CrudAction.UPDATE;

    return CrudAction.CREATE;
  }

  /**
   * Gets worker by id
   * @param workerId ID of the worker
   * @returns Worker or null if worker is not found
   */
  private async getWorker(workerId?: string | null) {
    if (!workerId) return null;

    const worker = await this.pg.query.workers.findFirst({
      where: eq(schema.workers.id, workerId),
      columns: {
        id: true,
        name: true,
        login: true,
        role: true,
        restaurantId: true,
        createdAt: true,
        updatedAt: true,
        firedAt: true,
        hiredAt: true,
        isBlocked: true,
        onlineAt: true,
      },
    });

    return worker ?? null;
  }

  /**
   * Creates a snapshot
   * @param payload Payload to create the snapshot
   * @returns Created snapshot
   */
  async create(payload: CreateSnapshotPayload) {
    const { model, data, documentId, workerId } = payload;

    const action = await this.determinateAction(payload);
    const worker = await this.getWorker(workerId);

    const snapshot = new this.snapshotModel({
      model,
      data,
      documentId,
      action,
      worker,
      workerId: workerId ?? null,
    });

    return await snapshot.save();
  }
}
