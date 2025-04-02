import { Inject, Injectable, Logger } from "@nestjs/common";
import { schema } from "@postgress-db/drizzle.module";
import { discountsConnections } from "@postgress-db/schema/discounts";
// import { discountsToRestaurants } from "@postgress-db/schema/discounts";
import { arrayOverlaps } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";
import { TimezonesService } from "src/timezones/timezones.service";

@Injectable()
export class OrderDiscountsService {
  private readonly logger = new Logger(OrderDiscountsService.name);

  constructor(
    // DB Connection
    @Inject(PG_CONNECTION) private readonly pg: NodePgDatabase<typeof schema>,
    private readonly timezonesService: TimezonesService,
  ) {}

  /**
   * Get discounts for the order
   * @param orderId - Order ID
   * @returns Discounts
   */
  public async getDiscounts(orderId: string) {
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
        name: true,
      },
    });

    return discounts;
  }
}
