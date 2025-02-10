import { Injectable, Logger } from "@nestjs/common";
import { plainToClass } from "class-transformer";
import { SocketService } from "src/@socket/socket.service";
import { GatewayWorker } from "src/@socket/socket.types";
import { OrderEntity } from "src/orders/@/entities/order.entity";

export enum OrderSocketEvents {
  ORDER_UPDATE = "order:update",
}

@Injectable()
export class OrdersSocketNotifier {
  private readonly logger = new Logger(OrdersSocketNotifier.name);

  constructor(private readonly socketService: SocketService) {}

  // private _getSharedRecipients(
  //   workers: GatewayWorker[],
  //   restaurantId?: string | null,
  // ) {
  //   return workers.filter((worker) => {
  //     if (
  //       worker.role === "SYSTEM_ADMIN" ||
  //       worker.role === "CHIEF_ADMIN" ||
  //       (restaurantId &&
  //         worker.role === "ADMIN" &&
  //         worker.restaurantId === restaurantId) ||
  //       (worker.role === "DISPATCHER" && !worker.restaurantId)
  //     ) {
  //       return true;
  //     }
  //   });
  // }

  // private async _notifyDefaultOrder(
  //   order: OrderEntity,
  //   workers: GatewayWorker[],
  // ) {
  //   const recipientWorkers = [
  //     ...this._getSharedRecipients(workers, order.restaurantId),
  //   ];

  //   this.socketService.emitTo(
  //     {
  //       workerIds: recipientWorkers.map((worker) => worker.id),
  //       clientIds: undefined,
  //     },
  //     OrderSocketEvents.ORDER_UPDATE,
  //     {
  //       order: plainToClass(OrderEntity, order, {
  //         excludeExtraneousValues: true,
  //       }),
  //     },
  //   );
  // }

  /**
   * ! WE SHOULD NOTIFY USERS ONLY IF ORDER HAVE CHANGED DATA
   * ! (needs to be implemented before calling that method)
   * @param order
   */
  public async handle(order: OrderEntity) {
    const workers = await this.socketService.getWorkers();

    // await this._notifyDefaultOrder(order, Object.values(workers));

    // const workersByRoleMap = this.makeWorkersByRoleMap(clients);
    // await this.socketService.emit(
    //   {
    //     workerIds: Object.keys(workers),
    //     clientIds: undefined,
    //   },
    // );
  }
}
