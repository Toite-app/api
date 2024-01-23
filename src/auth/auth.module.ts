import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { WorkersModule } from "src/workers/workers.module";

@Module({
  imports: [WorkersModule],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
