import { Module } from "@nestjs/common";
import { DrizzleModule } from "@postgress-db/drizzle.module";
import { SnapshotsModule } from "src/@base/snapshots/snapshots.module";
import { WorkshiftsService } from "src/workshifts/services/workshifts.service";
import { WorkshiftsController } from "src/workshifts/workshifts.controller";

@Module({
  imports: [DrizzleModule, SnapshotsModule],
  controllers: [WorkshiftsController],
  providers: [WorkshiftsService],
  exports: [WorkshiftsService],
})
export class WorkshiftsModule {}
