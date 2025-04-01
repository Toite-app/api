import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { ForbiddenException } from "@core/errors/exceptions/forbidden.exception";
import { NotFoundException } from "@core/errors/exceptions/not-found.exception";
import { ServerErrorException } from "@core/errors/exceptions/server-error.exception";
import { RequestWorker } from "@core/interfaces/request";
import { Inject, Injectable } from "@nestjs/common";
import { schema } from "@postgress-db/drizzle.module";
import {
  dishesMenus,
  dishesMenusToRestaurants,
} from "@postgress-db/schema/dishes-menus";
import { and, desc, eq, inArray, SQL } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";
import { DishesMenusProducer } from "src/dishes-menus/dishes-menus.producer";
import { CreateDishesMenuDto } from "src/dishes-menus/dto/create-dishes-menu.dto";
import { UpdateDishesMenuDto } from "src/dishes-menus/dto/update-dishes-menu.dto";
import { DishesMenuEntity } from "src/dishes-menus/entity/dishes-menu.entity";

@Injectable()
export class DishesMenusService {
  constructor(
    @Inject(PG_CONNECTION) private readonly pg: NodePgDatabase<typeof schema>,
    private readonly dishesMenusProducer: DishesMenusProducer,
  ) {}

  private async onApplicationBootstrap() {
    // TODO: replace to CRON
    await this.dishesMenusProducer.createOwnersDefaultMenu();
  }

  /**
   * Fetches a dish menu by its ID
   * @param id - The ID of the dish menu
   * @param options - Options for fetching the menu
   * @param options.worker - The worker making the request
   * @returns The fetched dish menu
   */
  public async findOne(
    id: string,
    options: {
      worker: RequestWorker;
    },
  ): Promise<DishesMenuEntity> {
    const { worker } = options;

    const fetchedMenu = await this.pg.query.dishesMenus.findFirst({
      where: and(
        eq(dishesMenus.id, id),
        // For owner only their own menus
        worker.role === "OWNER"
          ? eq(dishesMenus.ownerId, worker.id)
          : undefined,
        // For admin only menus of their restaurants
        worker.role === "ADMIN"
          ? inArray(
              dishesMenus.ownerId,
              worker.workersToRestaurants.map(
                ({ restaurantId }) => restaurantId,
              ),
            )
          : undefined,
      ),
      with: {
        dishesMenusToRestaurants: {
          columns: {},
          with: {
            restaurant: {
              columns: {
                id: true,
                name: true,
              },
            },
          },
        },
        owner: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!fetchedMenu) {
      throw new NotFoundException("errors.dishes-menus.dish-menu-not-found");
    }

    return {
      ...fetchedMenu,
      restaurants: fetchedMenu.dishesMenusToRestaurants.map(
        ({ restaurant }) => restaurant,
      ),
    };
  }
  /**
   * Fetches all dish menus
   * @param options - Options for fetching the menus
   * @param options.worker - The worker making the request
   * @returns All dish menus
   */
  public async findMany(options: {
    worker: RequestWorker;
  }): Promise<DishesMenuEntity[]> {
    const { worker } = options;

    const fetchedMenus = await this.pg.query.dishesMenus.findMany({
      // ...(conditions.length > 0 && { where: and(...conditions) }),
      where: (dishesMenus, { and, exists, eq, inArray }) => {
        const conditions: SQL[] = [
          // Exclude removed menus
          eq(dishesMenus.isRemoved, false),
        ];

        if (worker.role === "SYSTEM_ADMIN" || worker.role === "CHIEF_ADMIN") {
          // Fetch all menus
        } else if (worker.role === "OWNER") {
          // Fetch all menus of the owner
          conditions.push(eq(dishesMenus.ownerId, worker.id));
        } else if (worker.role === "ADMIN") {
          // Fetch all menus of the restaurants of the admin
          conditions.push(
            exists(
              this.pg
                .select({ restaurantId: dishesMenusToRestaurants.restaurantId })
                .from(dishesMenusToRestaurants)
                .where(
                  and(
                    eq(dishesMenusToRestaurants.dishesMenuId, dishesMenus.id),
                    inArray(
                      dishesMenusToRestaurants.restaurantId,
                      worker.workersToRestaurants.map(
                        ({ restaurantId }) => restaurantId,
                      ),
                    ),
                  ),
                ),
            ),
          );
        }

        return and(...conditions);
      },
      with: {
        dishesMenusToRestaurants: {
          columns: {},
          with: {
            restaurant: {
              columns: {
                id: true,
                name: true,
              },
            },
          },
        },
        owner: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [desc(dishesMenus.createdAt)],
    });

    return fetchedMenus.map(({ dishesMenusToRestaurants, ...dishesMenu }) => ({
      ...dishesMenu,
      restaurants: dishesMenusToRestaurants.map(({ restaurant }) => restaurant),
    }));
  }

  private async validateRestaurants(ownerId: string, restaurantIds: string[]) {
    if (restaurantIds.length === 0) {
      return true;
    }

    const restaurants = await this.pg.query.restaurants.findMany({
      where: (restaurants, { inArray, and, eq }) =>
        and(
          inArray(restaurants.id, restaurantIds),
          eq(restaurants.ownerId, ownerId),
        ),
      columns: {
        id: true,
      },
    });

    if (restaurants.length !== restaurantIds.length) {
      throw new BadRequestException(
        "errors.dishes-menus.some-restaurant-are-not-owned-by-the-owner",
        {
          property: "restaurantIds",
        },
      );
    }
  }

  /**
   * Creates a new dish menu
   * @param options - Options for creating the menu
   * @param options.worker - The worker making the request
   * @returns The created dish menu
   */
  public async create(
    payload: CreateDishesMenuDto,
    options: {
      worker: RequestWorker;
    },
  ): Promise<DishesMenuEntity> {
    const { worker } = options;

    const { restaurantIds, ...menuData } = payload;

    let ownerId: string | null = null;

    if (worker.role === "OWNER") {
      // For owner we will auto-assign it's id to menu
      ownerId = worker.id;
    } else if (
      worker.role === "SYSTEM_ADMIN" ||
      worker.role === "CHIEF_ADMIN"
    ) {
      // SYSTEM and CHIEF admins should provide ownerId
      if (!payload.ownerId) {
        throw new BadRequestException(
          "errors.dishes-menus.owner-id-is-required",
          {
            property: "ownerId",
          },
        );
      }

      ownerId = payload.ownerId;
    } else {
      throw new ForbiddenException("errors.dishes-menus.not-enough-rights");
    }

    if (typeof ownerId !== "string") {
      throw new ServerErrorException();
    }

    // Validate restaurants
    await this.validateRestaurants(ownerId, restaurantIds);

    const menuId = await this.pg.transaction(async (tx) => {
      const [createdMenu] = await tx
        .insert(dishesMenus)
        .values({
          ...menuData,
          ownerId: String(ownerId),
        })
        .returning({
          id: dishesMenus.id,
        });

      if (restaurantIds.length > 0) {
        await tx.insert(dishesMenusToRestaurants).values(
          restaurantIds.map((restaurantId) => ({
            dishesMenuId: createdMenu.id,
            restaurantId,
          })),
        );
      }

      return createdMenu.id;
    });

    return this.findOne(menuId, {
      worker,
    });
  }

  /**
   * Updates a dish menu
   * @param id - The ID of the dish menu
   * @param payload - The payload for updating the menu
   * @param options - Options for updating the menu
   * @param options.worker - The worker making the request
   * @returns The updated dish menu
   */
  public async update(
    id: string,
    payload: UpdateDishesMenuDto,
    options: {
      worker: RequestWorker;
    },
  ) {
    const { worker } = options;

    const { restaurantIds, ...menuData } = payload;

    const menu = await this.pg.query.dishesMenus.findFirst({
      where: eq(dishesMenus.id, id),
      columns: {
        ownerId: true,
      },
      with: {
        dishesMenusToRestaurants: {
          columns: {
            restaurantId: true,
          },
        },
      },
    });

    if (!menu) {
      throw new NotFoundException("errors.dishes-menus.dish-menu-not-found");
    }

    if (worker.role === "OWNER" && menu.ownerId !== worker.id) {
      // Owners can only update their own menus
      throw new ForbiddenException("errors.dishes-menus.not-enough-rights");
    } else if (
      // Admins can only update menus that have their restaurants
      worker.role === "ADMIN" &&
      !worker.workersToRestaurants.some(
        ({ restaurantId }) => restaurantId === menu.ownerId,
      )
    ) {
      throw new ForbiddenException("errors.dishes-menus.not-enough-rights");
    } else if (
      worker.role !== "SYSTEM_ADMIN" &&
      worker.role !== "CHIEF_ADMIN" &&
      worker.role !== "OWNER" &&
      worker.role !== "ADMIN"
    ) {
      // If not a OWNER, or ADMIN, or SYSTEM_ADMIN, or CHIEF_ADMIN, then you can't update the menu
      throw new ForbiddenException("errors.dishes-menus.not-enough-rights");
    }

    const ownerId =
      (worker.role === "SYSTEM_ADMIN" || worker.role === "CHIEF_ADMIN") &&
      payload.ownerId
        ? payload.ownerId
        : menu.ownerId;

    if (restaurantIds) {
      // Validate restaurants
      await this.validateRestaurants(ownerId, restaurantIds);
    }

    // Make update operation
    await this.pg.transaction(async (tx) => {
      await tx
        .update(dishesMenus)
        .set({
          ...menuData,
          ownerId: String(ownerId),
        })
        .where(eq(dishesMenus.id, id));

      // TODO: replace with individual function that will check if menu have some dishes that was assigned to editable restaurants
      if (restaurantIds) {
        await tx
          .delete(dishesMenusToRestaurants)
          .where(eq(dishesMenusToRestaurants.dishesMenuId, id));

        if (restaurantIds.length > 0) {
          await tx.insert(dishesMenusToRestaurants).values(
            restaurantIds.map((restaurantId) => ({
              dishesMenuId: id,
              restaurantId,
            })),
          );
        }
      }
    });

    return this.findOne(id, {
      worker,
    });
  }

  /**
   * Removes a dish menu
   * @param id - The ID of the dish menu
   * @param options - Options for removing the menu
   * @param options.worker - The worker making the request
   */
  public async remove(
    id: string,
    options: {
      worker: RequestWorker;
    },
  ) {
    const { worker } = options;

    if (
      worker.role !== "SYSTEM_ADMIN" &&
      worker.role !== "CHIEF_ADMIN" &&
      worker.role !== "OWNER"
    ) {
      throw new ForbiddenException("errors.dishes-menus.not-enough-rights");
    }

    const menu = await this.pg.query.dishesMenus.findFirst({
      where: eq(dishesMenus.id, id),
      columns: {},
      with: {
        dishesMenusToRestaurants: {
          columns: {
            restaurantId: true,
          },
        },
      },
    });

    if (!menu) {
      throw new NotFoundException("errors.dishes-menus.dish-menu-not-found");
    }

    if (menu.dishesMenusToRestaurants.length > 0) {
      throw new BadRequestException("errors.dishes-menus.menu-has-restaurants");
    }

    const [removedMenu] = await this.pg
      .update(dishesMenus)
      .set({
        isRemoved: true,
        removedAt: new Date(),
      })
      .where(
        and(
          eq(dishesMenus.id, id),
          eq(dishesMenus.isRemoved, false),
          worker.role === "OWNER"
            ? eq(dishesMenus.ownerId, worker.id)
            : undefined,
        ),
      )
      .returning({
        id: dishesMenus.id,
      });

    if (!removedMenu) {
      throw new NotFoundException("errors.dishes-menus.unable-to-remove-menu");
    }

    return true;
  }
}
