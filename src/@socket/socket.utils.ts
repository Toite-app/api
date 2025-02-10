import env from "@core/env";
import { parse as parseCookie } from "cookie";
import { Socket } from "socket.io";
import { AUTH_COOKIES } from "src/auth/auth.types";
import { v4 as uuidv4 } from "uuid";

export class SocketUtils {
  public static get commonGatewaysIdentifier() {
    return `socket-gateway(${env.NODE_ENV})`;
  }

  public static generateGatewayId() {
    const gatewayId = uuidv4()
      .replaceAll("-", "")
      .replaceAll(" ", "")
      .replaceAll("_", "")
      .replaceAll(":", "")
      .replaceAll(".", "");

    return `${SocketUtils.commonGatewaysIdentifier}:${gatewayId}`;
  }

  public static getClientAuthCookie(socket: Socket): string | null {
    const cookies = parseCookie(socket.handshake.headers.cookie || "");
    const auth = cookies?.[AUTH_COOKIES.token];

    return auth ?? null;
  }

  public static getUserAgent(socket: Socket): string {
    const headers = socket.handshake.headers;

    return (headers["user-agent"] || headers["User-Agent"]) as string;
  }

  public static getClientIp(socket: Socket): string {
    return (
      socket.handshake.address ??
      socket.handshake.headers["x-forwarded-for"] ??
      socket.conn.remoteAddress
    );
  }

  public static getDesiredWorkerId(socket: Socket) {
    const headers = socket.handshake.headers;

    const secretKey = headers["x-dev-secret-key"];
    const desiredWorkerId = headers["x-dev-worker-id"];

    if (secretKey !== env.DEV_SECRET_KEY) {
      return null;
    }

    if (!desiredWorkerId || typeof desiredWorkerId !== "string") {
      return null;
    }

    return desiredWorkerId;
  }
}
