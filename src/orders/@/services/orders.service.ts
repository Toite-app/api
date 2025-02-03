import { IFilters } from "@core/decorators/filter.decorator";
import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { NotFoundException } from "@core/errors/exceptions/not-found.exception";
import { Inject, Injectable } from "@nestjs/common";
import { DrizzleUtils } from "@postgress-db/drizzle-utils";
import { Schema } from "@postgress-db/drizzle.module";
import { orderNumberBroneering, orders } from "@postgress-db/schema/orders";
import { count, desc, eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";
import { GuestsService } from "src/guests/guests.service";
import { CreateOrderDto } from "src/orders/@/dtos/create-order.dto";
import { UpdateOrderDto } from "src/orders/@/dtos/update-order.dto";
import { OrderEntity } from "src/orders/@/entities/order.entity";

@Injectable()
export class OrdersService {
  constructor(
    @Inject(PG_CONNECTION)
    private readonly pg: NodePgDatabase<Schema>,
    private readonly guestsService: GuestsService,
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

  public async checkTableNumber(restaurantId: string, tableNumber: string) {
    const order = await this.pg.query.orders.findFirst({
      where: (orders, { eq, and, inArray }) =>
        and(
          eq(orders.tableNumber, tableNumber),
          eq(orders.restaurantId, restaurantId),
          inArray(orders.status, ["pending", "cooking", "ready", "paid"]),
        ),
      columns: {
        id: true,
      },
    });

    if (order) {
      throw new BadRequestException(
        "errors.orders.table-number-is-already-taken",
        {
          property: "tableNumber",
        },
      );
    }
  }

  public async checkDto(dto: UpdateOrderDto) {
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
        await this.checkTableNumber(dto.restaurantId, dto.tableNumber);
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
  }

  async create(dto: CreateOrderDto): Promise<OrderEntity> {
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
    } = dto;

    const number = await this.generateOrderNumber();
    const guest = await this.guestsService.findByPhoneNumber(guestPhone);

    const [createdOrder] = await this.pg
      .insert(orders)
      .values({
        number,
        tableNumber,
        type,
        from: "internal",
        status: "pending",
        currency: "RUB",
        ...(delayedTo ? { delayedTo: new Date(delayedTo) } : {}),
        guestsAmount,
        note,
        restaurantId,

        // Guest info //
        guestId: guest?.id,
        guestName: guestName ?? guest?.name,
        guestPhone,
      })
      .returning({
        id: orders.id,
      });

    return this.findById(createdOrder.id);
  }

  async update(id: string, dto: UpdateOrderDto): Promise<OrderEntity> {
    await this.checkDto(dto);

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
    } = dto;

    let guestName =
      dto.guestName && dto.guestName.length > 0 ? dto.guestName : null;

    const guest = await this.guestsService.findByPhoneNumber(
      guestPhone ?? order.guestPhone,
    );

    if (!guestName && guest) {
      guestName = guest.name;
    }

    const [updatedOrder] = await this.pg
      .update(orders)
      .set({
        ...(tableNumber ? { tableNumber } : {}),
        ...(restaurantId ? { restaurantId } : {}),
        ...(delayedTo ? { delayedTo: new Date(delayedTo) } : {}),
        ...(note ? { note } : {}),
        ...(guest ? { guestId: guest.id } : {}),
        ...(guestName ? { guestName } : {}),
        ...(guestPhone ? { guestPhone } : {}),
        ...(guestsAmount ? { guestsAmount } : {}),
        ...(type ? { type } : {}),
      })
      .where(eq(orders.id, id))
      .returning({ id: orders.id });

    return this.findById(updatedOrder.id);
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

  public attachRestaurantsName<
    T extends { restaurant?: { name?: string | null } | null },
  >(orders: Array<T>): Array<T & { restaurantName: string | null }> {
    return orders.map((order) => ({
      ...order,
      restaurantName: order.restaurant?.name ?? null,
    }));
  }

  public async findById(id: string): Promise<OrderEntity> {
    const order = await this.pg.query.orders.findFirst({
      where: (orders, { eq }) => eq(orders.id, id),
      with: {
        restaurant: {
          columns: {
            name: true,
          },
        },
        orderDishes: true,
      },
    });

    if (!order) {
      throw new NotFoundException("errors.orders.with-this-id-doesnt-exist");
    }

    return this.attachRestaurantsName([order])[0];
  }
}
