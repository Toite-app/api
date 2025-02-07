import { Logger } from "@nestjs/common";
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { parse as parseCookie } from "cookie";
import { Socket } from "socket.io";
import { AUTH_COOKIES } from "src/auth/auth.types";
import { AuthService } from "src/auth/services/auth.service";

import { ConnectedClients } from "./socket.types";

@WebSocketGateway()
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server: Socket;
  private serviceId: string;
  private readonly logger = new Logger(SocketGateway.name);

  public readonly connectedClients: ConnectedClients = {};
  public readonly clientIdToWorkerIdMap: Map<string, string> = new Map();

  constructor(private readonly authService: AuthService) {}

  private getClientAuthCookie(socket: Socket): string | null {
    const cookies = parseCookie(socket.handshake.headers.cookie || "");
    const auth = cookies?.[AUTH_COOKIES.token];

    return auth ?? null;
  }

  private getUserAgent(socket: Socket): string {
    const headers = socket.handshake.headers;

    return (headers["user-agent"] || headers["User-Agent"]) as string;
  }

  private getClientIp(socket: Socket): string {
    return (
      socket.handshake.address ??
      socket.handshake.headers["x-forwarded-for"] ??
      socket.conn.remoteAddress
    );
  }

  async handleConnection(socket: Socket): Promise<void> {
    try {
      const clientId = socket.id;
      const signed = this.getClientAuthCookie(socket);
      const httpAgent = this.getUserAgent(socket);
      const clientIp = this.getClientIp(socket);

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

    this.clientIdToWorkerIdMap.delete(clientId);
  }
}
