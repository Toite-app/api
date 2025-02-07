import { Injectable } from "@nestjs/common";
import { SocketGateway } from "src/socket/socket.gateway";

@Injectable()
export class SocketService {
  constructor(private readonly socketGateway: SocketGateway) {}
}
