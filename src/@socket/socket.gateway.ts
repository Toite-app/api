import env from "@core/env";
import { Logger } from "@nestjs/common";
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import Redis from "ioredis";
import { Socket } from "socket.io";
import { RedisChannels } from "src/@base/redis/channels";
import { GatewayClient, GatewayClients } from "src/@socket/socket.types";
import { AuthService } from "src/auth/services/auth.service";

import { SocketUtils } from "./socket.utils";

@WebSocketGateway()
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server: Socket;

  private readonly logger = new Logger(SocketGateway.name);

  // Gateway ID for synchronization between gateways
  private readonly gatewayId: string;
  private readonly sharedGatewaysDataKey = `${SocketUtils.commonGatewaysIdentifier}:shared`;

  // Redis instances for synchronization between gateways
  private publisherRedis: Redis;
  private subscriberRedis: Redis;

  // Discovery interval
  private discoveryInterval: NodeJS.Timeout;
  private readonly DISCOVERY_INTERVAL = 1000; // milliseconds
  private readonly REDIS_CLIENTS_TTL = 5; // seconds

  // Local state of the gateway
  private clients: GatewayClients = [];
  private clientsSocketMap: Map<string, Socket> = new Map();

  constructor(private readonly authService: AuthService) {
    this.gatewayId = SocketUtils.generateGatewayId();
  }

  /**
   * Get a Redis client
   * @returns Redis client
   */
  private _getRedis() {
    const client = new Redis(`${env.REDIS_URL}/${RedisChannels.SOCKET}`, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    client.on("error", (error) => {
      this.logger.error("Redis client error:", error);
    });

    return client;
  }

  async onModuleInit() {
    this.publisherRedis = this._getRedis();
    this.subscriberRedis = this._getRedis();

    this.subscriberRedis.subscribe(this.gatewayId);
    this.subscriberRedis.on("message", (channel, message) => {
      this.logger.debug(channel, message);
    });

    await this._updateDiscovery();

    this.discoveryInterval = setInterval(async () => {
      await this._updateDiscovery();
    }, this.DISCOVERY_INTERVAL);
  }

  /**
   * Update the discovery status in Redis
   */
  private async _updateDiscovery() {
    try {
      await this.publisherRedis.setex(
        `${this.gatewayId}:clients`,
        this.REDIS_CLIENTS_TTL,
        JSON.stringify(this.clients),
      );
    } catch (error) {
      this.logger.error(error);
    }
  }

  /**
   * Get a worker for the socket connection
   * @param socket - The socket connection
   * @returns The worker
   */
  private async _getWorker(socket: Socket) {
    const signed = SocketUtils.getClientAuthCookie(socket);
    const httpAgent = SocketUtils.getUserAgent(socket);
    const clientIp = SocketUtils.getClientIp(socket);

    if (!signed) {
      throw new Error("No signed cookie found");
    }

    const session = await this.authService.validateSession(signed, {
      httpAgent,
      ip: clientIp,
    });

    if (!session) {
      throw new Error("Invalid session");
    }

    if (!session.worker) {
      throw new Error("Invalid session");
    }

    if (session.worker.isBlocked) {
      throw new Error("Worker is blocked");
    }

    return session.worker;
  }

  /**
   * Get all clients from all gateways
   * @returns All clients
   */
  public async getClients() {
    const gatewayKeys = await this.publisherRedis.keys(
      `${this.gatewayId}:clients`,
    );

    const clientsRaw = await this.publisherRedis.mget(gatewayKeys);

    const clients: GatewayClients = clientsRaw
      .filter(Boolean)
      .map((client) => JSON.parse(String(client)));

    return clients;
  }

  /**
   * Handle a new connection
   * @param socket - The socket connection
   */
  async handleConnection(socket: Socket) {
    try {
      const worker = await this._getWorker(socket);

      this.clients.push({
        clientId: socket.id,
        workerId: worker.id,
        gatewayId: this.gatewayId,
      } satisfies GatewayClient);

      this.clientsSocketMap.set(socket.id, socket);

      socket.emit("connected", worker);
    } catch (error) {
      this.logger.error(error);
      socket.disconnect(true);
    }
  }

  /**
   * Handle a disconnection
   * @param socket - The socket connection
   */
  async handleDisconnect(socket: Socket) {
    try {
      this.clients = this.clients.filter(
        (client) => client.clientId !== socket.id,
      );

      this.clientsSocketMap.delete(socket.id);
    } catch (error) {
      this.logger.error(error);
      socket.disconnect(true);
    }
  }
}
