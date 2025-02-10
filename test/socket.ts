import * as dotenv from "dotenv";
import { io } from "socket.io-client";

dotenv.config();

// console.log(process.env.DEV_SECRET_KEY);
const secretKey = process.env.DEV_SECRET_KEY;
const runAmount = 2;
const workerId = "a0902800-06d9-406e-a38e-f5eff06001dc";

async function createSocketInstance(instanceId: number) {
  const socket = io("http://localhost:3001", {
    extraHeaders: {
      "x-dev-secret-key": secretKey ?? "",
      "x-dev-worker-id": `${workerId}`,
    },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  socket.on("connect", () => {
    console.log(`[Instance ${instanceId}] Connected to socket`);
  });

  socket.on("connect_error", (error) => {
    console.error(`[Instance ${instanceId}] Connection error:`, error.message);
  });

  socket.on("reconnect_attempt", (attemptNumber) => {
    console.log(
      `[Instance ${instanceId}] Attempting to reconnect... (attempt ${attemptNumber})`,
    );
  });

  socket.on("disconnect", (reason) => {
    console.log(`[Instance ${instanceId}] Disconnected from socket: ${reason}`);
  });

  socket.onAny((eventName, ...args) => {
    console.log(
      `[Instance ${instanceId}] Event "${eventName}" received:`,
      ...args,
    );
  });

  return socket;
}

async function main() {
  const sockets = await Promise.all(
    Array.from({ length: runAmount }, (_, i) => createSocketInstance(i + 1)),
  );

  // Keep the process running
  process.on("SIGINT", () => {
    console.log("Closing socket connections...");
    sockets.forEach((socket) => socket.close());
    process.exit(0);
  });
}

main().catch(console.error);
