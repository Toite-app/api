import { RequestWorker } from "@core/interfaces/request";
import { Inject, Injectable } from "@nestjs/common";
import { Schema } from "@postgress-db/drizzle.module";
import { IOrderDish, orderDishes } from "@postgress-db/schema/order-dishes";
import { IOrder, orders } from "@postgress-db/schema/orders";
import { restaurantWorkshops } from "@postgress-db/schema/restaurant-workshop";
import { IWorker } from "@postgress-db/schema/workers";
import { differenceInMinutes } from "date-fns";
import { and, eq, exists, gt, inArray, or, SQL } from "drizzle-orm";
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
  private async _getWorkerWorkshops(
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

  private getIsReadyOnTime({
    cookingTimeInMin,
    cookingAt,
    readyAt,
  }: {
    cookingTimeInMin: number;
    cookingAt?: Date | null;
    readyAt?: Date | null;
  }) {
    if (!cookingAt && !readyAt) {
      return false;
    }

    const differenceInMin = differenceInMinutes(
      cookingAt ?? new Date(),
      readyAt ?? new Date(),
    );

    return differenceInMin <= cookingTimeInMin;
  }

  /**
   * Get the where clause for orders
   * @param worker - The worker
   * @returns The where clause
   */
  private _getOrdersWhere(worker: RequestWorker): SQL {
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

    if (worker.role !== "SYSTEM_ADMIN" && worker.role !== "CHIEF_ADMIN") {
      // Get ids to which worker has assigned
      const restaurantIdsSet = new Set(
        worker.workersToRestaurants.map((wtr) => wtr.restaurantId),
      );

      // If worker is owner, add all owned restaurants to the set
      if (worker.role === "OWNER") {
        worker.ownedRestaurants.forEach((r) => {
          restaurantIdsSet.add(r.id);
        });
      }

      conditions.push(
        inArray(orders.restaurantId, Array.from(restaurantIdsSet)),
      );
    }

    return and(...conditions) as SQL;
  }

  private _getOrderDishesWhere(worker: RequestWorker): SQL {
    worker;

    return and(
      // Only not removed
      eq(orderDishes.isRemoved, false),
      // Only dishes with quantity > 0
      gt(orderDishes.quantity, 0),
      // Only dishes with cooking or ready status
      or(eq(orderDishes.status, "cooking"), eq(orderDishes.status, "ready")),
    ) as SQL;
  }

  /**
   * Maps database order data to KitchenerOrderEntity
   * @param fetchedOrders - The orders fetched from database
   * @param worker - The worker making the request
   * @param workerWorkshopsIdsSet - Set of workshop IDs the worker has access to
   * @returns Mapped KitchenerOrderEntity array
   */
  private _mapOrdersToKitchenerOrderEntities(
    fetchedOrders: Array<
      Pick<
        IOrder,
        | "id"
        | "status"
        | "number"
        | "tableNumber"
        | "from"
        | "type"
        | "note"
        | "guestsAmount"
        | "createdAt"
        | "updatedAt"
        | "delayedTo"
        | "cookingAt"
      > & {
        orderDishes: Array<
          Pick<
            IOrderDish,
            | "id"
            | "status"
            | "name"
            | "quantity"
            | "quantityReturned"
            | "isAdditional"
            | "cookingAt"
            | "readyAt"
          > & {
            dish: {
              cookingTimeInMin: number;
              dishesToWorkshops: Array<{
                workshopId: string;
                workshop: {
                  name: string;
                };
              }>;
            };
            dishModifiersToOrderDishes: Array<{
              dishModifierId: string;
              dishModifier: {
                name: string;
              };
            }>;
          }
        >;
      }
    >,
    worker: RequestWorker,
    workerWorkshopsIdsSet: Set<string>,
  ): KitchenerOrderEntity[] {
    return fetchedOrders.map(
      ({ orderDishes, ...order }) =>
        ({
          ...order,
          orderDishes: orderDishes.map(
            ({ dish, dishModifiersToOrderDishes, ...orderDish }) => ({
              ...orderDish,
              cookingTimeInMin: dish.cookingTimeInMin,
              isReadyOnTime: this.getIsReadyOnTime({
                cookingTimeInMin: dish.cookingTimeInMin,
                cookingAt: orderDish.cookingAt,
                readyAt: orderDish.readyAt,
              }),
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
                      worker.role === "SYSTEM_ADMIN" ??
                      worker.role === "CHIEF_ADMIN" ??
                      workerWorkshopsIdsSet.has(workshopId),
                  }) satisfies KitchenerOrderEntity["orderDishes"][number]["workshops"][number],
              ),
            }),
          ),
        }) satisfies KitchenerOrderEntity,
    );
  }

  /**
   * Find one order
   * @param orderId - The id of the order
   * @param opts - The options
   * @returns The order
   */
  public async findOne(
    orderId: string,
    opts: {
      worker: RequestWorker;
    },
  ): Promise<KitchenerOrderEntity | null> {
    const { worker } = opts;

    const order = await this.pg.query.orders.findFirst({
      where: (orders, { eq, and }) =>
        and(
          // Specify order id
          eq(orders.id, orderId),
          // Default orders where
          this._getOrdersWhere(worker),
        ),
      with: {
        orderDishes: {
          // Filter
          where: this._getOrderDishesWhere(worker),
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
                  // Check if workshop is assigned to restaurant
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
              columns: {
                cookingTimeInMin: true,
              },
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
    });

    if (!order) {
      return null;
    }

    const workerWorkshops = await this._getWorkerWorkshops({
      id: worker.id,
      role: worker.role,
    });

    const workerWorkshopsIdsSet = new Set(
      workerWorkshops?.map((ww) => ww.id) ?? [],
    );

    const mappedOrders = this._mapOrdersToKitchenerOrderEntities(
      [order],
      worker,
      workerWorkshopsIdsSet,
    );

    return mappedOrders[0] ?? null;
  }

  /**
   * Finds all orders for a kitchener worker
   * @param opts - The options
   * @returns An array of orders
   */
  public async findMany(opts: {
    worker: RequestWorker;
  }): Promise<KitchenerOrderEntity[]> {
    const { worker } = opts;
    const workerId = worker.id;

    const workerWorkshops = await this._getWorkerWorkshops({
      id: workerId,
      role: worker.role,
    });

    const workerWorkshopsIdsSet = new Set(
      workerWorkshops?.map((ww) => ww.id) ?? [],
    );

    const fetchedOrders = await this.pg.query.orders.findMany({
      where: this._getOrdersWhere(worker),
      with: {
        orderDishes: {
          // Filter
          where: this._getOrderDishesWhere(worker),
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
                  // Check if workshop is assigned to restaurant
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
              columns: {
                cookingTimeInMin: true,
              },
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

    return this._mapOrdersToKitchenerOrderEntities(
      fetchedOrders,
      worker,
      workerWorkshopsIdsSet,
    );
  }
}
