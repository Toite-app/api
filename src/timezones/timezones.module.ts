import { Module } from "@nestjs/common";
import { TimezonesController } from "src/timezones/timezones.controller";
import { TimezonesService } from "src/timezones/timezones.service";

@Module({
  imports: [],
  controllers: [TimezonesController],
  providers: [TimezonesService],
  exports: [TimezonesService],
})
export class TimezonesModule {}
