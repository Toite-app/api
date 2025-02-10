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
import {
  GatewayClient,
  GatewayClients,
  GatewayWorker,
} from "src/@socket/socket.types";
import { AuthService } from "src/auth/services/auth.service";

import { SocketUtils } from "./socket.utils";

@WebSocketGateway()
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server: Socket;

  private readonly logger = new Logger(SocketGateway.name);

  // Gateway ID for synchronization between gateways
  private readonly gatewayId: string;

  // Redis instances for synchronization between gateways
  private publisherRedis: Redis;
  private subscriberRedis: Redis;

  // Discovery interval
  private discoveryInterval: NodeJS.Timeout;
  private readonly DISCOVERY_INTERVAL = 1000; // milliseconds
  private readonly REDIS_CLIENTS_TTL = 5; // seconds

  // Local state of the gateway
  private localClients: GatewayClients = [];
  private localClientsSocketMap: Map<string, Socket> = new Map();
  private localWorkersMap: Map<string, GatewayWorker> = new Map();

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
        JSON.stringify(this.localClients),
      );

      await this.publisherRedis.setex(
        `${this.gatewayId}:workers`,
        this.REDIS_CLIENTS_TTL,
        JSON.stringify(Object.fromEntries(this.localWorkersMap.entries())),
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
   * Get all workers from all gateways
   * @returns All workers
   */
  public async getWorkers() {
    const gatewayKeys = await this.publisherRedis.keys(
      `${this.gatewayId}:workers`,
    );

    const workersRaw = await this.publisherRedis.mget(gatewayKeys);

    const workers: GatewayWorker[] = workersRaw
      .filter(Boolean)
      .map((worker) => JSON.parse(String(worker)));

    return workers.reduce(
      (acc, worker) => {
        if (
          acc?.[worker.id] &&
          new Date(worker.connectedAt).getTime() <
            new Date(acc[worker.id].connectedAt).getTime()
        ) {
          return acc;
        }

        acc[worker.id] = worker;

        return acc;
      },
      {} as Record<string, GatewayWorker>,
    );
  }

  /**
   * Handle a new connection
   * @param socket - The socket connection
   */
  async handleConnection(socket: Socket) {
    try {
      const worker = await this._getWorker(socket);
      const connectedAt = new Date();

      this.localClients.push({
        clientId: socket.id,
        workerId: worker.id,
        gatewayId: this.gatewayId,
        connectedAt,
      } satisfies GatewayClient);

      this.localClientsSocketMap.set(socket.id, socket);

      this.localWorkersMap.set(worker.id, {
        id: worker.id,
        role: worker.role,
        restaurantId: worker.restaurantId,
        connectedAt,
      } satisfies GatewayWorker);

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
      this.localClients = this.localClients.filter(
        (client) => client.clientId !== socket.id,
      );

      this.localClientsSocketMap.delete(socket.id);
    } catch (error) {
      this.logger.error(error);
      socket.disconnect(true);
    }
  }
}
