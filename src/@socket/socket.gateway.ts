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
import { SocketUtils } from "src/@socket/socket.utils";
import { AuthService } from "src/auth/services/auth.service";

import { ConnectedClients, RedisConnectedClients } from "./socket.types";

@WebSocketGateway()
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  // Instance of the socket server
  @WebSocketServer()
  private server: Socket;

  private readonly logger = new Logger(SocketGateway.name);

  // Gateway ID for synchronization between gateways
  private gatewayId: string;

  // For synchronization between gateways
  private publisherRedis: Redis;
  private subscriberRedis: Redis;
  private discoveryInterval: NodeJS.Timeout;

  // Local state for gateway
  public readonly connectedClients: ConnectedClients = {};
  public readonly clientIdToWorkerIdMap: Map<string, string> = new Map();

  private readonly REDIS_CLIENTS_TTL = 5; // seconds

  constructor(private readonly authService: AuthService) {
    this.gatewayId = SocketUtils.generateGatewayId();
  }

  async onModuleInit() {
    this.publisherRedis = this.getRedisClient();
    this.subscriberRedis = this.getRedisClient();

    this.subscriberRedis.subscribe(this.gatewayId);
    this.subscriberRedis.on("message", (channel, message) => {
      // console.log(channel, message);
      this.logger.debug(channel, message);
    });

    await this.startChannelDiscovery();
  }

  async onModuleDestroy() {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
    }

    await Promise.all([
      this.publisherRedis?.disconnect(),
      this.subscriberRedis?.disconnect(),
    ]);
  }

  private async startChannelDiscovery() {
    await this.updateDiscoveryStatus();

    this.discoveryInterval = setInterval(async () => {
      await this.updateDiscoveryStatus();
    }, 1000);
  }

  private async updateDiscoveryStatus() {
    try {
      const clientsToSync: RedisConnectedClients = {};

      // Convert local clients to redis format (without socket)
      Object.entries(this.connectedClients).forEach(([workerId, clients]) => {
        clientsToSync[workerId] = {};
        Object.entries(clients).forEach(([clientId, client]) => {
          const { socket, ...clientWithoutSocket } = client;

          socket;

          clientsToSync[workerId][clientId] = {
            ...clientWithoutSocket,
            gatewayId: this.gatewayId,
          };
        });
      });

      // Save to Redis with TTL
      await this.publisherRedis.setex(
        `${this.gatewayId}:clients`,
        this.REDIS_CLIENTS_TTL,
        JSON.stringify(clientsToSync),
      );
    } catch (error) {
      this.logger.error("Failed to update discovery status:", error);
    }
  }

  public async getAllConnectedClients(): Promise<RedisConnectedClients> {
    try {
      // Get all gateway keys
      const gatewayKeys = await this.publisherRedis.keys("*:clients");

      // Fetch all clients data from Redis
      const clientsData = await Promise.all(
        gatewayKeys.map(async (key) => {
          const data = await this.publisherRedis.get(key);
          return data ? JSON.parse(data) : {};
        }),
      );

      // Merge all clients with local clients
      const allClients: RedisConnectedClients = {};

      // First add local clients
      Object.entries(this.connectedClients).forEach(([workerId, clients]) => {
        allClients[workerId] = {};
        Object.entries(clients).forEach(([clientId, client]) => {
          const { socket, ...clientWithoutSocket } = client;

          socket;

          allClients[workerId][clientId] = {
            ...clientWithoutSocket,
            gatewayId: this.gatewayId,
          };
        });
      });

      // Then merge with Redis clients
      clientsData.forEach((gatewayClients) => {
        Object.entries(gatewayClients).forEach(
          ([workerId, clients]: [string, any]) => {
            if (!allClients[workerId]) {
              allClients[workerId] = {};
            }
            Object.assign(allClients[workerId], clients);
          },
        );
      });

      return allClients;
    } catch (error) {
      this.logger.error("Failed to get all connected clients:", error);
      return {};
    }
  }

  private getRedisClient() {
    const client = new Redis(`${env.REDIS_URL}/${RedisChannels.SOCKET}`, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    client.on("error", (error) => {
      console.error("Redis client error:", error);
    });

    return client;
  }

  async handleConnection(socket: Socket): Promise<void> {
    try {
      const clientId = socket.id;
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

      if (!this.connectedClients[session.workerId]) {
        this.connectedClients[session.workerId] = {};
      }

      this.connectedClients[session.workerId][clientId] = {
        clientId,
        socket,
        session: {
          id: session.id,
          isActive: session.isActive,
          previousId: session.previousId,
        },
        worker: {
          id: session.workerId,
          isBlocked: session.worker.isBlocked,
          restaurantId: session.worker.restaurantId,
          role: session.worker.role,
        },
      };

      this.clientIdToWorkerIdMap.set(clientId, session.workerId);

      socket.emit("connected", session.worker);

      // Trigger immediate sync after successful connection
      await this.updateDiscoveryStatus();
    } catch (error) {
      this.logger.error(error);
      socket.disconnect(true);
    }
  }

  async handleDisconnect(socket: Socket): Promise<void> {
    const clientId = socket.id;
    const workerId = this.clientIdToWorkerIdMap.get(clientId);

    if (!workerId) {
      return;
    }

    delete this.connectedClients[workerId][clientId];

    if (Object.keys(this.connectedClients[workerId]).length === 0) {
      delete this.connectedClients[workerId];
    }

    this.clientIdToWorkerIdMap.delete(clientId);

    // Trigger immediate sync after client disconnection
    await this.updateDiscoveryStatus();
  }
}
