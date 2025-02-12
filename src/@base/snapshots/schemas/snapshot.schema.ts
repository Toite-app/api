import { CrudAction } from "@core/types/general";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { IWorker } from "@postgress-db/schema/workers";

import { SnapshotModel } from "../types";

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
  @Prop({ required: true, enum: SnapshotModel })
  model: SnapshotModel;

  /**
   * The action that was taken
   */
  @Prop({ required: true, enum: CrudAction })
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

  createdAt: Date;
  updatedAt: Date;
}

export const SnapshotSchema = SchemaFactory.createForClass(Snapshot);
