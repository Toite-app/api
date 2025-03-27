import { Injectable } from "@nestjs/common";
import { SocketGateway } from "src/@socket/socket.gateway";
import { GatewayClient, SocketEmitTo } from "src/@socket/socket.types";

@Injectable()
export class SocketService {
  constructor(private readonly socketGateway: SocketGateway) {}

  public async getClients() {
    return await this.socketGateway.getClients();
  }

  public async getWorkers() {
    return await this.socketGateway.getWorkers();
  }

  public async getCurrentPathnames() {
    return await this.socketGateway.getCurrentPathnames();
  }

  public async emit(
    messages: { recipient: GatewayClient; event: string; data: any }[],
  ) {
    return await this.socketGateway.emit(messages);
  }

  public async emitToMultiple(
    recipients: GatewayClient[],
    event: string,
    data: any,
  ) {
    return await this.socketGateway.emit(
      recipients.map((recipient) => ({
        recipient,
        event,
        data,
      })),
    );
  }

  public async emitTo(to: SocketEmitTo, event: string, data: any) {
    const clients = await this.getClients();

    const findClientIdsSet = new Set(to.clientIds);
    const findWorkerIdsSet = new Set(to.workerIds);

    // Get array of recipients (clients) that will receive the message
    const recipients = clients.filter((client) => {
      if (to?.clientIds && findClientIdsSet.has(client.clientId)) return true;
      if (to?.workerIds && findWorkerIdsSet.has(client.workerId)) return true;

      return false;
    });

    return await this.emitToMultiple(recipients, event, data);
  }
}
