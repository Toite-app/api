import env from "@core/env";
import { Logger } from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import Redis from "ioredis";
import { Socket } from "socket.io";
import { RedisChannels } from "src/@base/redis/channels";
import {
  GatewayClient,
  GatewayClients,
  GatewayIncomingMessage,
  GatewayMessage,
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
  private localClientsCurrentPathnameMap: Record<string, string> = {};
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

    this.subscriberRedis.subscribe(`${this.gatewayId}-messages`);
    this.subscriberRedis.on("message", (channel, message) => {
      this._handleMessage(JSON.parse(message) as GatewayMessage[]);
    });

    await this._updateDiscovery();

    this.discoveryInterval = setInterval(async () => {
      await this._updateDiscovery();
    }, this.DISCOVERY_INTERVAL);
  }

  /**
   * Handle a message from Redis
   * @param messages - The messages to handle
   */
  private async _handleMessage(messages: GatewayMessage[]) {
    try {
      // Group messages by clientId for efficient socket emission
      const messagesByClient = messages.reduce(
        (acc, message) => {
          if (!acc[message.clientId]) {
            acc[message.clientId] = [];
          }
          acc[message.clientId].push(message);
          return acc;
        },
        {} as Record<string, GatewayMessage[]>,
      );

      // Emit messages for each client
      Object.entries(messagesByClient).forEach(([clientId, clientMessages]) => {
        const socket = this.localClientsSocketMap.get(clientId);
        if (socket) {
          clientMessages.forEach((message) => {
            socket.emit(message.event, message.data);
          });
        }
      });
    } catch (error) {
      this.logger.error(error);
    }
  }

  /**
   * Update the discovery status in Redis
   */
  private async _updateDiscovery() {
    try {
      const pipeline = this.publisherRedis.pipeline();

      pipeline.setex(
        `${this.gatewayId}:clients`,
        this.REDIS_CLIENTS_TTL,
        JSON.stringify(this.localClients),
      );

      pipeline.setex(
        `${this.gatewayId}:workers`,
        this.REDIS_CLIENTS_TTL,
        JSON.stringify(Object.fromEntries(this.localWorkersMap.entries())),
      );

      pipeline.setex(
        `${this.gatewayId}:current-pathnames`,
        this.REDIS_CLIENTS_TTL,
        JSON.stringify(this.localClientsCurrentPathnameMap),
      );

      await pipeline.exec();
    } catch (error) {
      this.logger.error(error);
    }
  }

  private async _getDesiredWorker(socket: Socket) {
    if (env.NODE_ENV !== "development") {
      return null;
    }

    const desiredWorkerId = SocketUtils.getDesiredWorkerId(socket);

    if (!desiredWorkerId) {
      return null;
    }

    return await this.authService.getAuthWorker(desiredWorkerId);
  }

  /**
   * Get a worker for the socket connection
   * @param socket - The socket connection
   * @returns The worker
   */
  private async _getWorker(socket: Socket) {
    const desiredWorker = await this._getDesiredWorker(socket);

    if (desiredWorker) {
      return desiredWorker;
    }

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
  public async getClients(): Promise<GatewayClient[]> {
    const gatewayKeys = await this.publisherRedis.keys(
      `${SocketUtils.commonGatewaysIdentifier}:*:clients`,
    );

    const clientsRaw = await this.publisherRedis.mget(gatewayKeys);

    const clients: GatewayClient[] = clientsRaw
      .filter(Boolean)
      .flatMap((client) => JSON.parse(String(client)));

    return clients;
  }

  /**
   * Get all workers from all gateways
   * @returns All workers
   */
  public async getWorkers(): Promise<Record<string, GatewayWorker>> {
    const gatewayKeys = await this.publisherRedis.keys(
      `${SocketUtils.commonGatewaysIdentifier}:*:workers`,
    );

    const workersRaw = await this.publisherRedis.mget(gatewayKeys);

    const workers: GatewayWorker[] = Object.values(
      workersRaw
        .filter(Boolean)
        .flatMap((workers) =>
          Object.values(
            JSON.parse(String(workers)) as Record<string, GatewayWorker>,
          ),
        ),
    );

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
   * Get all subscriptions from all gateways
   * @returns All subscriptions
   */
  public async getCurrentPathnames(): Promise<Record<string, string>> {
    const gatewayKeys = await this.publisherRedis.keys(
      `${SocketUtils.commonGatewaysIdentifier}:*:current-pathnames`,
    );

    const currentPathnamesRaw = await this.publisherRedis.mget(gatewayKeys);

    const currentPathnames = currentPathnamesRaw.reduce(
      (acc, currentPathnameRaw) => {
        if (!currentPathnameRaw) {
          return acc;
        }

        const currentPathname = JSON.parse(
          String(currentPathnameRaw),
        ) as Record<string, string>;

        Object.entries(currentPathname).forEach(([clientId, pathname]) => {
          acc[clientId] = pathname;
        });

        return acc;
      },
      {} as Record<string, string>,
    );

    return currentPathnames;
  }

  public async emit(
    messages: { recipient: GatewayClient; event: string; data: any }[],
  ) {
    // Group messages by gateway for batch publishing
    const messagesByGateway = messages.reduce(
      (acc, { recipient, event, data }) => {
        if (!acc[recipient.gatewayId]) {
          acc[recipient.gatewayId] = [];
        }
        acc[recipient.gatewayId].push({
          clientId: recipient.clientId,
          event,
          data,
        });
        return acc;
      },
      {} as Record<string, GatewayMessage[]>,
    );

    // Handle local emissions
    const localMessages = messagesByGateway[this.gatewayId] ?? [];
    localMessages.forEach((message) => {
      const localSocket = this.localClientsSocketMap.get(message.clientId);
      if (localSocket) {
        localSocket.emit(message.event, message.data);
      }
    });

    // Create batched messages for each gateway
    const pipeline = this.publisherRedis.pipeline();

    Object.entries(messagesByGateway).forEach(([gatewayId, messages]) => {
      if (gatewayId === this.gatewayId) return;

      pipeline.publish(`${gatewayId}-messages`, JSON.stringify(messages));
    });

    try {
      await pipeline.exec();
    } catch (error) {
      this.logger.error("Error publishing messages:", error);
    }
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
        restaurants: worker.workersToRestaurants,
        connectedAt,
      } satisfies GatewayWorker);
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
      delete this.localClientsCurrentPathnameMap[socket.id];
    } catch (error) {
      this.logger.error(error);
      socket.disconnect(true);
    }
  }

  /**
   * Handle a current pathname
   * @param incomingData - The incoming data
   * @param socket - The socket connection
   */
  @SubscribeMessage(GatewayIncomingMessage.CURRENT_PATHNAME)
  async handleCurrentPathname(
    @MessageBody() incomingData: { pathname: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const clientId = socket.id;

    try {
      this.localClientsCurrentPathnameMap[clientId] = incomingData.pathname;
    } catch (error) {
      this.logger.error(error);
    }
  }
}
