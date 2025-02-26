import { RequestWorker } from "@core/interfaces/request";
import { Inject, Injectable } from "@nestjs/common";
import { Schema } from "@postgress-db/drizzle.module";
import { orderDishes } from "@postgress-db/schema/order-dishes";
import { orders } from "@postgress-db/schema/orders";
import { restaurantWorkshops } from "@postgress-db/schema/restaurant-workshop";
import { IWorker } from "@postgress-db/schema/workers";
import { SQL } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";
import { KitchenerOrderEntity } from "src/orders/kitchener/entities/kitchener-order.entity";

@Injectable()
export class KitchenerOrdersService {
  constructor(
    @Inject(PG_CONNECTION)
    private readonly pg: NodePgDatabase<Schema>,
  ) {}

  /**
   * Get all workshop ids for a worker
   * @param workerId - The id of the worker
   * @returns An array of workshop ids
   */
  private async getWorkerWorkshops(
    worker: Pick<IWorker, "role" | "id">,
  ): Promise<{ id: string; name: string }[] | undefined> {
    // System admin and chief admin can see all workshops
    if (worker.role === "SYSTEM_ADMIN" || worker.role === "CHIEF_ADMIN") {
      return undefined;
    }

    const workerWorkshops = await this.pg.query.workshopWorkers.findMany({
      where: (workshopWorkers, { eq }) =>
        eq(workshopWorkers.workerId, worker.id),
      with: {
        workshop: {
          columns: {
            isEnabled: true,
            name: true,
          },
        },
      },
      columns: {
        workshopId: true,
      },
    });

    return workerWorkshops
      .filter((ww) => !!ww.workshop && ww.workshop.isEnabled)
      .map((ww) => ({
        id: ww.workshopId,
        name: ww.workshop.name,
      }));
  }

  async findMany(opts: {
    worker: RequestWorker;
  }): Promise<KitchenerOrderEntity[]> {
    const { worker } = opts;
    const workerId = worker.id;
    const restaurantIds = worker.workersToRestaurants.map(
      (wtr) => wtr.restaurantId,
    );

    const workerWorkshops = await this.getWorkerWorkshops({
      id: workerId,
      role: worker.role,
    });

    const workerWorkshopsIdsSet = new Set(
      workerWorkshops?.map((ww) => ww.id) ?? [],
    );

    const fetchedOrders = await this.pg.query.orders.findMany({
      where: (orders, { eq, and, or, exists, inArray }) => {
        const conditions: SQL[] = [
          // Exclude archived orders
          eq(orders.isArchived, false),
          // Exclude removed orders
          eq(orders.isRemoved, false),
          // Include only orders with cooking status
          eq(orders.status, "cooking"),
          // Have cooking or ready dishes
          exists(
            this.pg
              .select({
                id: orderDishes.id,
              })
              .from(orderDishes)
              .where(
                and(
                  eq(orderDishes.orderId, orders.id),
                  or(
                    eq(orderDishes.status, "cooking"),
                    eq(orderDishes.status, "ready"),
                  ),
                  eq(orderDishes.isRemoved, false),
                ),
              ),
          ),
        ];

        // System admin and chief admin can see all orders
        if (worker.role !== "SYSTEM_ADMIN" && worker.role !== "CHIEF_ADMIN") {
          conditions.push(inArray(orders.restaurantId, restaurantIds));
        }

        return and(...conditions);
      },
      with: {
        orderDishes: {
          // Filter
          where: (orderDishes, { eq, and, gt, or }) =>
            and(
              // Only not removed
              eq(orderDishes.isRemoved, false),
              // Only dishes with quantity > 0
              gt(orderDishes.quantity, 0),
              // Only dishes with cooking or ready status
              or(
                eq(orderDishes.status, "cooking"),
                eq(orderDishes.status, "ready"),
              ),
            ),
          // Select
          columns: {
            id: true,
            status: true,
            name: true,
            quantity: true,
            quantityReturned: true,
            isAdditional: true,
            cookingAt: true,
            readyAt: true,
          },
          with: {
            dishModifiersToOrderDishes: {
              columns: {
                dishModifierId: true,
              },
              with: {
                dishModifier: {
                  columns: {
                    name: true,
                  },
                },
              },
            },
            dish: {
              with: {
                dishesToWorkshops: {
                  where: (dishesToWorkshops, { eq, and, exists }) =>
                    and(
                      exists(
                        this.pg
                          .select({ id: restaurantWorkshops.id })
                          .from(restaurantWorkshops)
                          .where(
                            and(
                              eq(
                                restaurantWorkshops.restaurantId,
                                orders.restaurantId,
                              ),
                              eq(
                                restaurantWorkshops.id,
                                dishesToWorkshops.workshopId,
                              ),
                            ),
                          ),
                      ),
                    ),
                  columns: {
                    workshopId: true,
                  },
                  with: {
                    workshop: {
                      columns: {
                        name: true,
                      },
                    },
                  },
                },
              },
              columns: {},
            },
          },
        },
      },
      columns: {
        id: true,
        status: true,
        number: true,
        tableNumber: true,
        from: true,
        type: true,
        note: true,
        guestsAmount: true,
        createdAt: true,
        updatedAt: true,
        delayedTo: true,
        cookingAt: true,
      },
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
      limit: 100,
    });

    return fetchedOrders.map(
      ({ orderDishes, ...order }) =>
        ({
          ...order,
          orderDishes: orderDishes.map(
            ({ dish, dishModifiersToOrderDishes, ...orderDish }) => ({
              ...orderDish,
              modifiers: dishModifiersToOrderDishes.map(
                ({ dishModifierId, dishModifier }) => ({
                  id: dishModifierId,
                  name: dishModifier.name,
                }),
              ),
              workshops: dish.dishesToWorkshops.map(
                ({ workshopId, workshop }) =>
                  ({
                    id: workshopId,
                    name: workshop.name,
                    isMyWorkshop:
                      worker.role === "SYSTEM_ADMIN" ||
                      worker.role === "CHIEF_ADMIN" ||
                      workerWorkshopsIdsSet.has(workshopId),
                  }) satisfies KitchenerOrderEntity["orderDishes"][number]["workshops"][number],
              ),
            }),
          ),
        }) satisfies KitchenerOrderEntity,
    );
  }
}
