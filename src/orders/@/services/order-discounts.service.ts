import { Inject, Injectable, Logger } from "@nestjs/common";
import { schema } from "@postgress-db/drizzle.module";
import { discountsConnections } from "@postgress-db/schema/discounts";
// import { discountsToRestaurants } from "@postgress-db/schema/discounts";
import { arrayOverlaps } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";
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
        guestId: true,
        restaurantId: true,
      },
      with: {
        restaurant: {
          columns: {
            timezone: true,
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

    const discounts = await this.pg.query.discounts.findMany({
      where: (discounts, { or, eq, exists, and, isNull, lte, gte }) =>
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
        ),
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

  private getMaxDiscountsMap(discounts: OrderDiscount[]) {
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

  public async applyDiscounts(orderId: string) {
    const discounts = await this.getDiscounts(orderId);
    const maxDiscounts = this.getMaxDiscountsMap(discounts);

    const orderDishes = await this.pg.query.orderDishes.findMany({
      where: (orderDishes, { and, eq, gt }) =>
        and(
          eq(orderDishes.orderId, orderId),
          eq(orderDishes.isRemoved, false),
          gt(orderDishes.quantity, 0),
        ),
      columns: {
        id: true,
        price: true,
      },
      with: {
        dish: {
          columns: {
            menuId: true,
          },
        },
      },
    });
  }
}
