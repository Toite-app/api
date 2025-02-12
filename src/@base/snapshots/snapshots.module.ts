import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DrizzleModule } from "@postgress-db/drizzle.module";

import { Snapshot, SnapshotSchema } from "./schemas/snapshot.schema";
import { SnapshotsService } from "./snapshots.service";

@Module({
  imports: [
    DrizzleModule,
    MongooseModule.forFeature([
      { name: Snapshot.name, schema: SnapshotSchema },
    ]),
  ],
  controllers: [],
  providers: [SnapshotsService],
  exports: [SnapshotsService],
})
export class SnapshotsModule {}
