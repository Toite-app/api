import { Module } from "@nestjs/common";
import { AuthModule } from "src/auth/auth.module";
import { SocketGateway } from "src/socket/socket.gateway";

import { SocketService } from "./socket.service";

@Module({
  imports: [AuthModule],
  providers: [SocketService, SocketGateway],
  exports: [SocketService],
})
export class SocketModule {}
