import { IFilters } from "@core/decorators/filter.decorator";
import { IPagination } from "@core/decorators/pagination.decorator";
import { ISorting } from "@core/decorators/sorting.decorator";
import { NotFoundException } from "@core/errors/exceptions/not-found.exception";
import { Inject, Injectable } from "@nestjs/common";
import { DrizzleUtils } from "@postgress-db/drizzle-utils";
import { Schema } from "@postgress-db/drizzle.module";
import { orderNumberBroneering, orders } from "@postgress-db/schema/orders";
import { asc, count, desc, eq, sql } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { AnyPgSelect, PgSelectPrepare } from "drizzle-orm/pg-core";
import { PG_CONNECTION } from "src/constants";
import { GuestsService } from "src/guests/guests.service";
import { CreateOrderDto } from "src/orders/@/dtos/create-order.dto";
import { OrderEntity } from "src/orders/@/entities/order.entity";

@Injectable()
export class OrdersService {
  private readonly findByIdQuery: PgSelectPrepare<AnyPgSelect>;

  constructor(
    @Inject(PG_CONNECTION)
    private readonly pg: NodePgDatabase<Schema>,
    private readonly guestsService: GuestsService,
  ) {
    this.findByIdQuery = this.pg
      .select({
        id: orders.id,
        number: orders.number,
        tableNumber: orders.tableNumber,
        type: orders.type,
        status: orders.status,
        currency: orders.currency,
        from: orders.from,
        note: orders.note,
        guestName: orders.guestName,
        guestPhone: orders.guestPhone,
        guestsAmount: orders.guestsAmount,
        subtotal: orders.subtotal,
        discountAmount: orders.discountAmount,
        surchargeAmount: orders.surchargeAmount,
        bonusUsed: orders.bonusUsed,
        total: orders.total,
        isHiddenForGuest: orders.isHiddenForGuest,
        isRemoved: orders.isRemoved,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        removedAt: orders.removedAt,
        delayedTo: orders.delayedTo,
        restaurantId: orders.restaurantId,
        guestId: orders.guestId,
      })
      .from(orders)
      .where(eq(orders.id, sql.placeholder("id")))
      .limit(1)
      .prepare("find_order_by_id");
  }

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

  async create(dto: CreateOrderDto): Promise<OrderEntity> {
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

    const [order] = await this.pg
      .insert(orders)
      .values({
        number,
        tableNumber,
        type,
        from: "internal",
        status: "pending",
        currency: "RUB",
        delayedTo,
        guestsAmount,
        note,
        restaurantId,

        // Guest info //
        guestId: guest?.id,
        guestName: guestName ?? guest?.name,
        guestPhone,
      })
      .returning();

    return order;
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

  public async findMany(options?: {
    pagination?: IPagination;
    sorting?: ISorting;
    filters?: IFilters;
  }): Promise<OrderEntity[]> {
    const { pagination, sorting, filters } = options ?? {};

    const query = this.pg
      .select({
        id: orders.id,
        number: orders.number,
        tableNumber: orders.tableNumber,
        type: orders.type,
        status: orders.status,
        currency: orders.currency,
        from: orders.from,
        note: orders.note,
        guestName: orders.guestName,
        guestPhone: orders.guestPhone,
        guestsAmount: orders.guestsAmount,
        subtotal: orders.subtotal,
        discountAmount: orders.discountAmount,
        surchargeAmount: orders.surchargeAmount,
        bonusUsed: orders.bonusUsed,
        total: orders.total,
        isHiddenForGuest: orders.isHiddenForGuest,
        isRemoved: orders.isRemoved,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        removedAt: orders.removedAt,
        delayedTo: orders.delayedTo,
        restaurantId: orders.restaurantId,
        guestId: orders.guestId,
      })
      .from(orders);

    if (filters) {
      query.where(DrizzleUtils.buildFilterConditions(orders, filters));
    }

    if (sorting) {
      query.orderBy(
        sorting.sortOrder === "asc"
          ? asc(sql.identifier(sorting.sortBy))
          : desc(sql.identifier(sorting.sortBy)),
      );
    }

    return await query
      .limit(pagination?.size ?? 10)
      .offset(pagination?.offset ?? 0);
  }

  public async findById(id: string): Promise<OrderEntity> {
    const result = await this.findByIdQuery.execute({ id });

    const order = result[0];

    if (!order) {
      throw new NotFoundException("errors.orders.with-this-id-doesnt-exist");
    }

    return order;
  }
}
