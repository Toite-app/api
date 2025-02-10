import env from "@core/env";
import { Injectable } from "@nestjs/common";
import Redis from "ioredis";
import { RedisChannels } from "src/@base/redis/channels";
import { SocketGateway } from "src/@socket/socket.gateway";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class SocketService {
  constructor(private readonly socketGateway: SocketGateway) {}

  public async getClients() {
    return await this.socketGateway.getClients();
  }

  public async getWorkers() {
    return await this.socketGateway.getWorkers();
  }
}
