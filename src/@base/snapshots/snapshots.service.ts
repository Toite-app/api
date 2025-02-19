import { CrudAction } from "@core/types/general";
import { deepCompare } from "@core/utils/deep-compare";
import { Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { schema } from "@postgress-db/drizzle.module";
import { eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Model } from "mongoose";
import {
  CreateSnapshotPayload,
  SnapshotChange,
} from "src/@base/snapshots/types";
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
   * Determines the action to be taken based on the payload and previous snapshot
   */
  determinateAction(
    payload: CreateSnapshotPayload,
    previousSnapshot: SnapshotDocument | null,
  ) {
    const { data } = payload;

    if (payload.action) return payload.action;
    if (data === null) return CrudAction.DELETE;
    if (!previousSnapshot) return CrudAction.CREATE;

    return CrudAction.UPDATE;
  }

  /**
   * Gets the previous snapshot for the document
   */
  async getPreviousSnapshot(documentId: string, model: string) {
    return await this.snapshotModel
      .findOne({ documentId, model })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Calculates changes between two snapshots
   */
  calculateChanges(oldData: any, newData: any): SnapshotChange[] {
    const { changedPaths } = deepCompare(oldData, newData);

    return changedPaths.map((path) => ({
      path,
      oldValue: path
        .split(".")
        .reduce((obj, key) => obj?.[key.replace(/\[\d+\]/, "")], oldData),
      newValue: path
        .split(".")
        .reduce((obj, key) => obj?.[key.replace(/\[\d+\]/, "")], newData),
    }));
  }

  /**
   * Gets worker by id
   * @param workerId ID of the worker
   * @returns Worker or null if worker is not found
   */
  async getWorker(workerId?: string | null) {
    if (!workerId) return null;

    const worker = await this.pg.query.workers.findFirst({
      where: eq(schema.workers.id, workerId),
      with: {
        workersToRestaurants: {
          columns: {
            restaurantId: true,
          },
        },
      },
      columns: {
        id: true,
        name: true,
        login: true,
        role: true,
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
}
