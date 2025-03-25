import { CrudAction } from "@core/types/general";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { IWorker } from "@postgress-db/schema/workers";

import { SnapshotChange, SnapshotModel } from "../types";

export type SnapshotDocument = Snapshot & Document;

@Schema({ timestamps: true })
export class Snapshot {
  /**
   * The id of the document that was changed
   */
  @Prop({ required: true })
  documentId: string;

  /**
   * The model that was changed
   */
  @Prop({
    type: String,
    required: true,
    enum: SnapshotModel,
  })
  model: SnapshotModel;

  /**
   * The action that was taken
   */
  @Prop({
    type: String,
    required: true,
    enum: CrudAction,
  })
  action: CrudAction;

  /**
   * The data that was changed
   */
  @Prop({ required: false, type: Object })
  data: object | null;

  /**
   * The id of the worker that made the change
   */
  @Prop({ required: false, type: String })
  workerId: string | null;

  /**
   * The worker that made the change
   */
  @Prop({ required: false, type: Object })
  worker: Omit<IWorker, "passwordHash"> | null;

  /**
   * Array of changes that were made in this snapshot
   */
  @Prop({ required: false, type: Array })
  changes: SnapshotChange[];

  createdAt: Date;
  updatedAt: Date;
}

export const SnapshotSchema = SchemaFactory.createForClass(Snapshot);
