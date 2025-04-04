import { RequestWorker } from "@core/interfaces/request";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { schema } from "@postgress-db/drizzle.module";
import {
  discountsConnections,
  discountsToGuests,
} from "@postgress-db/schema/discounts";
import { IOrderDish } from "@postgress-db/schema/order-dishes";
import { orderHistoryRecords } from "@postgress-db/schema/order-history";
import { orders } from "@postgress-db/schema/orders";
// import { discountsToRestaurants } from "@postgress-db/schema/discounts";
import { arrayOverlaps, eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";
import {
  OrderDishesRepository,
  OrderDishUpdatePayload,
} from "src/orders/@/repositories/order-dishes.repository";
import { TimezonesService } from "src/timezones/timezones.service";

type connectionKey = string;
type OrderDiscount = {
  id: string;
  percent: number;
  connectionsSet: Set<connectionKey>;
};

@Injectable()
export class OrderDiscountsService {
  private readonly logger = new Logger(OrderDiscountsService.name);

  constructor(
    // DB Connection
    @Inject(PG_CONNECTION) private readonly pg: NodePgDatabase<typeof schema>,
    private readonly timezonesService: TimezonesService,
    private readonly orderDishesRepository: OrderDishesRepository,
  ) {}

  private _getConnectionKey(
    dishMenuId: string,
    dishCategoryId: string,
  ): connectionKey {
    return `${dishMenuId}:${dishCategoryId}`;
  }

  /**
   * Get discounts for the order
   * @param orderId - Order ID
   * @returns Discounts
   */
  public async getDiscounts(orderId: string): Promise<OrderDiscount[]> {
    const order = await this.pg.query.orders.findFirst({
      where: (orders, { eq }) => eq(orders.id, orderId),
      columns: {
        type: true,
        from: true,
        discountsGuestId: true,
        restaurantId: true,
      },
      with: {
        restaurant: {
          columns: {
            timezone: true,
          },
        },
        discountsToOrders: {
          columns: {
            discountId: true,
          },
        },
      },
    });

    if (!order || !order.restaurant) {
      return [];
    }

    const timezone = order.restaurant.timezone;

    const currentDayOfWeek =
      this.timezonesService.getCurrentDayOfWeek(timezone);

    const currentTime = this.timezonesService.getCurrentTime(timezone);

    const additionalDiscountsIds = order.discountsToOrders.map(
      ({ discountId }) => discountId,
    );

    const discounts = await this.pg.query.discounts.findMany({
      where: (
        discounts,
        { or, eq, exists, notExists, and, isNull, lte, gte, inArray },
      ) => {
        return or(
          // Additional order discounts should be applied without additional checks
          // Cause this checks should be performed before creating record
          additionalDiscountsIds.length > 0
            ? inArray(discounts.id, additionalDiscountsIds)
            : undefined,
          // General search
          and(
            // Active from to date
            and(
              lte(discounts.activeFrom, new Date()),
              gte(discounts.activeTo, new Date()),
            ),
            // Check that discount is enabled
            eq(discounts.isEnabled, true),
            // Check that type and from are in the discount
            arrayOverlaps(discounts.orderFroms, [order.from]),
            arrayOverlaps(discounts.orderTypes, [order.type]),
            // Check that discount is active for the current day of week
            arrayOverlaps(discounts.daysOfWeek, [currentDayOfWeek]),
            // Check restaurants assigned to the discount
            exists(
              this.pg
                .select({
                  restaurantId: discountsConnections.restaurantId,
                })
                .from(discountsConnections)
                .where(
                  and(
                    eq(discountsConnections.discountId, discounts.id),
                    eq(
                      discountsConnections.restaurantId,
                      String(order.restaurantId),
                    ),
                  ),
                ),
            ),
            or(
              // NULL values means that discount is active all the time
              and(isNull(discounts.startTime), isNull(discounts.endTime)),
              // Check if current time is between start and end time
              and(
                lte(discounts.startTime, currentTime),
                gte(discounts.endTime, currentTime),
              ),
            ),
            order.discountsGuestId
              ? // If order have discounts guest id load both: shared and personal discounts
                or(
                  exists(
                    this.pg
                      .select({
                        discountId: discountsToGuests.discountId,
                      })
                      .from(discountsToGuests)
                      .where(
                        and(
                          eq(discountsToGuests.discountId, discounts.id),
                          eq(discountsToGuests.guestId, order.discountsGuestId),
                        ),
                      ),
                  ),
                  notExists(
                    this.pg
                      .select({
                        discountId: discountsToGuests.discountId,
                      })
                      .from(discountsToGuests)
                      .where(eq(discountsToGuests.discountId, discounts.id)),
                  ),
                )
              : // If not only discounts that doesn't have guests assigns
                notExists(
                  this.pg
                    .select({
                      discountId: discountsToGuests.discountId,
                    })
                    .from(discountsToGuests)
                    .where(eq(discountsToGuests.discountId, discounts.id)),
                ),
          ),
        );
      },
      columns: {
        id: true,
        percent: true,
      },
      with: {
        connections: {
          where: (connections, { eq }) =>
            eq(connections.restaurantId, String(order.restaurantId)),
          columns: {
            dishesMenuId: true,
            dishCategoryId: true,
          },
        },
      },
    });

    return discounts.map(({ id, percent, connections }) => ({
      id,
      percent,
      connectionsSet: new Set(
        connections.map(({ dishesMenuId, dishCategoryId }) =>
          this._getConnectionKey(dishesMenuId, dishCategoryId),
        ),
      ),
    }));
  }

  /**
   * Get max discounts map
   * @param discounts
   * @returns
   */
  private _getMaxDiscountsMap(discounts: OrderDiscount[]) {
    const discountsMap = new Map<
      connectionKey,
      { id: string; percent: number }
    >();

    // sort from lower to higher percent
    discounts
      .sort((a, b) => a.percent - b.percent)
      .forEach((discount) => {
        Array.from(discount.connectionsSet).forEach((connectionKey) => {
          discountsMap.set(connectionKey, {
            id: discount.id,
            percent: discount.percent,
          });
        });
      });

    return discountsMap;
  }

  /**
   * Get order dishes discounts map
   * @param orderDishes
   * @param maxDiscounts
   * @returns
   */
  private _getOrderDishesDiscountsMap(
    orderDishes: Array<
      Pick<IOrderDish, "id"> & {
        menuId: string;
        categoryIds: string[];
      }
    >,
    maxDiscounts: Map<connectionKey, { id: string; percent: number }>,
  ) {
    const orderDishIdToDiscount = new Map<
      string,
      { id: string; percent: number }
    >();

    orderDishes.forEach(({ id, menuId, categoryIds }) => {
      categoryIds.forEach((categoryId) => {
        const connectionKey = this._getConnectionKey(menuId, categoryId);
        const discount = maxDiscounts.get(connectionKey);

        if (!discount) {
          return;
        }

        orderDishIdToDiscount.set(id, discount);
      });
    });

    return orderDishIdToDiscount;
  }

  /**
   * Apply discounts to the order dishes
   * @param orderId - Order ID
   */
  public async applyDiscounts(
    orderId: string,
    opts?: { worker?: RequestWorker },
  ) {
    const discounts = await this.getDiscounts(orderId);
    const maxDiscounts = this._getMaxDiscountsMap(discounts);

    const order = await this.pg.query.orders.findFirst({
      where: (orders, { eq }) => eq(orders.id, orderId),
      columns: {
        applyDiscounts: true,
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    const orderDishes = await this.pg.query.orderDishes.findMany({
      where: (orderDishes, { and, eq, gt, isNull }) =>
        and(
          eq(orderDishes.orderId, orderId),
          eq(orderDishes.isRemoved, false),
          gt(orderDishes.quantity, 0),
          isNull(orderDishes.discountId),
        ),
      columns: {
        id: true,
        price: true,
        surchargeAmount: true,
      },
      with: {
        dish: {
          columns: {
            menuId: true,
          },
          with: {
            dishesToDishCategories: {
              columns: {
                dishCategoryId: true,
              },
            },
          },
        },
      },
    });

    const orderDishIdToDiscount = this._getOrderDishesDiscountsMap(
      orderDishes.map((od) => ({
        ...od,
        menuId: String(od.dish?.menuId),
        categoryIds: (od.dish?.dishesToDishCategories || []).map(
          ({ dishCategoryId }) => dishCategoryId,
        ),
      })),
      maxDiscounts,
    );

    await this.pg.transaction(async (tx) => {
      await this.orderDishesRepository.updateMany(
        orderDishes
          .map(({ id, price, surchargeAmount }) => {
            const discount = orderDishIdToDiscount.get(id);

            if (!discount) {
              return null;
            }

            return {
              orderDishId: id,
              discountId: discount.id,
              discountPercent: discount.percent.toString(),
              price,
              surchargeAmount,
            } satisfies OrderDishUpdatePayload;
          })
          .filter((od) => od !== null),
        {
          tx,
          workerId: opts?.worker?.id,
        },
      );

      if (!order.applyDiscounts) {
        await tx
          .update(orders)
          .set({
            applyDiscounts: true,
          })
          .where(eq(orders.id, orderId));

        await tx.insert(orderHistoryRecords).values({
          orderId,
          type: "discounts_enabled",
          ...(opts?.worker?.id && { workerId: opts.worker.id }),
        });
      }
    });
  }
}
