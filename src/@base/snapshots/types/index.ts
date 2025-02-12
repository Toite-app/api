import { CrudAction } from "@core/types/general";

export enum SnapshotModel {
  RESTAURANTS = "RESTAURANTS",
  ORDERS = "ORDERS",
}

export type CreateSnapshotPayload = {
  documentId: string;
  model: `${SnapshotModel}`;
  action?: `${CrudAction}`;
  data: any;
  workerId?: string | null;
};

export interface SnapshotChange {
  path: string;
  oldValue: any;
  newValue: any;
}
