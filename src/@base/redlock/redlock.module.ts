import { Module } from "@nestjs/common";
import { RedlockService } from "src/@base/redlock/redlock.service";

@Module({
  imports: [],
  controllers: [],
  providers: [RedlockService],
  exports: [RedlockService],
})
export class RedlockModule {}
