import { Module } from "@nestjs/common";
import { DrizzleModule } from "@postgress-db/drizzle.module";
import { GuestsController } from "src/guests/guests.controller";
import { GuestsService } from "src/guests/guests.service";

@Module({
  imports: [DrizzleModule],
  controllers: [GuestsController],
  providers: [GuestsService],
  exports: [GuestsService],
})
export class GuestsModule {}
