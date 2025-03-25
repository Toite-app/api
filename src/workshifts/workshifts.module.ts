import { Module } from "@nestjs/common";
import { DrizzleModule } from "@postgress-db/drizzle.module";
import { SnapshotsModule } from "src/@base/snapshots/snapshots.module";
import { WorkshiftsService } from "src/workshifts/@/services/workshifts.service";
import { WorkshiftsController } from "src/workshifts/@/workshifts.controller";
import { WorkshiftPaymentsService } from "src/workshifts/payments/services/workshift-payments.service";
import { WorkshiftPaymentsController } from "src/workshifts/payments/workshift-payments.controller";

@Module({
  imports: [DrizzleModule, SnapshotsModule],
  controllers: [WorkshiftsController, WorkshiftPaymentsController],
  providers: [WorkshiftsService, WorkshiftPaymentsService],
  exports: [WorkshiftsService],
})
export class WorkshiftsModule {}
