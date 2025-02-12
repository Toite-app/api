import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DrizzleModule } from "@postgress-db/drizzle.module";
import { SnapshotsProcessor } from "src/@base/snapshots/snapshots.processor";
import { SnapshotsProducer } from "src/@base/snapshots/snapshots.producer";
import { SNAPSHOTS_QUEUE } from "src/@base/snapshots/types";

import { Snapshot, SnapshotSchema } from "./schemas/snapshot.schema";
import { SnapshotsService } from "./snapshots.service";

@Module({
  imports: [
    DrizzleModule,
    MongooseModule.forFeature([
      { name: Snapshot.name, schema: SnapshotSchema },
    ]),
    BullModule.registerQueue({
      name: SNAPSHOTS_QUEUE,
    }),
  ],
  controllers: [],
  providers: [SnapshotsService, SnapshotsProcessor, SnapshotsProducer],
  exports: [SnapshotsProducer],
})
export class SnapshotsModule {}
