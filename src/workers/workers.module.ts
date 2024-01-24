import { Module } from "@nestjs/common";
import { WorkersController } from "./workers.controller";
import { WorkersService } from "./workers.service";
import { DrizzleModule } from "@postgress-db/drizzle.module";
import { SessionsService } from "src/sessions/sessions.service";

@Module({
  imports: [DrizzleModule],
  providers: [WorkersService, SessionsService],
  controllers: [WorkersController],
  exports: [WorkersService],
})
export class WorkersModule {}
