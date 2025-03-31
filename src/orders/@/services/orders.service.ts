import { IFilters } from "@core/decorators/filter.decorator";
import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { NotFoundException } from "@core/errors/exceptions/not-found.exception";
import { ServerErrorException } from "@core/errors/exceptions/server-error.exception";
import { Inject, Injectable } from "@nestjs/common";
import { DrizzleUtils } from "@postgress-db/drizzle-utils";
import { Schema } from "@postgress-db/drizzle.module";
import { orderNumberBroneering, orders } from "@postgress-db/schema/orders";
import { count, desc, sql } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";
import { GuestsService } from "src/guests/guests.service";
import { CreateOrderDto } from "src/orders/@/dtos/create-order.dto";
import { UpdateOrderDto } from "src/orders/@/dtos/update-order.dto";
import { OrderEntity } from "src/orders/@/entities/order.entity";
import { OrdersRepository } from "src/orders/@/repositories/orders.repository";
import { OrdersQueueProducer } from "src/orders/@queue/orders-queue.producer";

@Injectable()
export class OrdersService {
  constructor(
    @Inject(PG_CONNECTION)
    private readonly pg: NodePgDatabase<Schema>,
    private readonly guestsService: GuestsService,
    private readonly ordersQueueProducer: OrdersQueueProducer,
    private readonly repository: OrdersRepository,
  ) {}

  private async generateOrderNumber() {
    // get last broneering
    const lastBroneering = await this.pg.query.orderNumberBroneering.findFirst({
      orderBy: desc(orderNumberBroneering.createdAt),
    });

    let number = "1";

    if (lastBroneering) {
      number = `${Number(lastBroneering.number) + 1}`;
    }

    await this.pg.insert(orderNumberBroneering).values({
      number,
    });

    return number;
  }

  private readonly checkTableNumberStatement = this.pg.query.orders
    .findFirst({
      where: (orders, { eq, and, inArray }) =>
        and(
          eq(orders.tableNumber, sql.placeholder("tableNumber")),
          eq(orders.restaurantId, sql.placeholder("restaurantId")),
          inArray(orders.status, ["pending", "cooking", "ready", "paid"]),
        ),
      columns: {
        id: true,
      },
    })
    .prepare(`${OrdersService.name}_checkTableNumber`);

  public async checkTableNumber(
    restaurantId: string,
    tableNumber: string,
    orderId?: string,
  ) {
    const order = await this.checkTableNumberStatement.execute({
      restaurantId,
      tableNumber,
    });

    if (order && order.id !== orderId) {
      throw new BadRequestException(
        "errors.orders.table-number-is-already-taken",
        {
          property: "tableNumber",
        },
      );
    }
  }

  public async checkDto(dto: UpdateOrderDto, orderId?: string) {
    if (dto.type === "banquet" || dto.type === "hall") {
      // Table number is required for banquet and hall
      if (!dto.tableNumber || dto.tableNumber === "") {
        throw new BadRequestException(
          "errors.orders.table-number-is-required",
          {
            property: "tableNumber",
          },
        );
      }

      if (!dto.restaurantId) {
        throw new BadRequestException(
          "errors.orders.restaurant-is-required-for-banquet-or-hall",
          {
            property: "restaurantId",
          },
        );
      }

      if (dto.restaurantId) {
        await this.checkTableNumber(dto.restaurantId, dto.tableNumber, orderId);
      }
    }

    // Phone number is required for delivery, takeaway and banquet
    if (
      (!dto.guestPhone || dto.guestPhone === "") &&
      (dto.type === "delivery" ||
        dto.type === "takeaway" ||
        dto.type === "banquet")
    ) {
      throw new BadRequestException("errors.orders.phone-number-is-required", {
        property: "guestPhone",
      });
    }

    if (!dto.paymentMethodId && !!dto.restaurantId) {
      throw new BadRequestException(
        "errors.orders.payment-method-is-required",
        {
          property: "paymentMethodId",
        },
      );
    }

    if (!!dto.paymentMethodId) {
      const paymentMethod = await this.pg.query.paymentMethods.findFirst({
        where: (paymentMethods, { eq }) =>
          eq(paymentMethods.id, String(dto.paymentMethodId)),
        columns: {
          isActive: true,
          restaurantId: true,
        },
      });

      if (!paymentMethod) {
        throw new BadRequestException(
          "errors.orders.payment-method-not-found",
          {
            property: "paymentMethodId",
          },
        );
      }

      if (paymentMethod.isActive === false) {
        throw new BadRequestException(
          "errors.orders.payment-method-is-not-active",
          {
            property: "paymentMethodId",
          },
        );
      }

      if (paymentMethod.restaurantId !== dto.restaurantId) {
        throw new BadRequestException(
          "errors.orders.payment-method-is-not-for-this-restaurant",
          {
            property: "paymentMethodId",
          },
        );
      }
    }
  }

  async create(
    dto: CreateOrderDto,
    opts?: { workerId?: string },
  ): Promise<OrderEntity> {
    await this.checkDto(dto);

    const {
      type,
      guestName,
      guestPhone,
      guestsAmount,
      note,
      delayedTo,
      restaurantId,
      tableNumber,
      paymentMethodId,
    } = dto;

    const number = await this.generateOrderNumber();
    const guest = await this.guestsService.findByPhoneNumber(guestPhone);

    const restaurant = await this.pg.query.restaurants.findFirst({
      where: (restaurants, { eq }) => eq(restaurants.id, String(restaurantId)),
      columns: {
        currency: true,
      },
    });

    if (!restaurant) {
      throw new ServerErrorException();
    }

    const createdOrder = await this.repository.create(
      {
        number,
        tableNumber,
        type,
        from: "internal",
        status: "pending",
        currency: restaurant?.currency,
        paymentMethodId,
        ...(delayedTo ? { delayedTo: new Date(delayedTo) } : {}),
        guestsAmount,
        note,
        restaurantId,

        // Guest info //
        guestId: guest?.id,
        guestName: guestName ?? guest?.name,
        guestPhone,
      },
      {
        workerId: opts?.workerId,
      },
    );

    const order = await this.findById(createdOrder.id);

    // Notify users
    await this.ordersQueueProducer.newOrder(createdOrder.id);

    return order;
  }

  async update(
    id: string,
    dto: UpdateOrderDto,
    opts?: { workerId?: string },
  ): Promise<OrderEntity> {
    await this.checkDto(dto, id);

    const order = await this.pg.query.orders.findFirst({
      where: (orders, { eq }) => eq(orders.id, id),
      columns: {
        id: true,
        guestId: true,
        guestName: true,
        guestPhone: true,
      },
    });

    if (!order) {
      throw new NotFoundException("errors.orders.with-this-id-doesnt-exist");
    }

    const {
      tableNumber,
      restaurantId,
      delayedTo,
      note,
      guestPhone,
      guestsAmount,
      type,
      paymentMethodId,
    } = dto;

    let guestName =
      dto.guestName && dto.guestName.length > 0 ? dto.guestName : null;

    const guest = await this.guestsService.findByPhoneNumber(
      guestPhone ?? order.guestPhone,
    );

    if (!guestName && guest) {
      guestName = guest.name;
    }

    const updatedOrder = await this.repository.update(
      id,
      {
        ...(tableNumber ? { tableNumber } : {}),
        ...(restaurantId ? { restaurantId } : {}),
        ...(delayedTo ? { delayedTo: new Date(delayedTo) } : {}),
        ...(note ? { note } : {}),
        ...(guest ? { guestId: guest.id } : {}),
        ...(guestName ? { guestName } : {}),
        ...(guestPhone ? { guestPhone } : {}),
        ...(guestsAmount ? { guestsAmount } : {}),
        ...(type ? { type } : {}),
        ...(paymentMethodId ? { paymentMethodId } : {}),
      },
      {
        workerId: opts?.workerId,
      },
    );

    const updatedOrderEntity = await this.findById(updatedOrder.id);

    // Notify users
    await this.ordersQueueProducer.update({
      orderId: id,
    });

    return updatedOrderEntity;
  }

  public async getTotalCount(filters?: IFilters): Promise<number> {
    const query = this.pg
      .select({
        value: count(),
      })
      .from(orders);

    if (filters) {
      query.where(DrizzleUtils.buildFilterConditions(orders, filters));
    }

    return await query.then((res) => res[0].value);
  }

  public async findById(id: string): Promise<OrderEntity> {
    const order = await this.repository.findById(id);

    if (!order) {
      throw new NotFoundException("errors.orders.with-this-id-doesnt-exist");
    }

    return order;
  }
}
