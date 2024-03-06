import { Module } from "@nestjs/common";
import { DrizzleModule } from "@postgress-db/drizzle.module";

import { WorkersController } from "./workers.controller";
import { WorkersService } from "./workers.service";

@Module({
  imports: [DrizzleModule],
  providers: [WorkersService],
  controllers: [WorkersController],
  exports: [WorkersService],
})
export class WorkersModule {}
