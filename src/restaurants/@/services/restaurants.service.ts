import { IPagination } from "@core/decorators/pagination.decorator";
import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { NotFoundException } from "@core/errors/exceptions/not-found.exception";
import { RequestWorker } from "@core/interfaces/request";
import { Inject, Injectable } from "@nestjs/common";
import { schema } from "@postgress-db/drizzle.module";
import { dishesMenusToRestaurants } from "@postgress-db/schema/dishes-menus";
import { restaurants } from "@postgress-db/schema/restaurants";
import { and, count, eq, exists, ilike, inArray, SQL } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";
import { TimezonesService } from "src/timezones/timezones.service";

import { CreateRestaurantDto } from "../dto/create-restaurant.dto";
import { UpdateRestaurantDto } from "../dto/update-restaurant.dto";
import { RestaurantEntity } from "../entities/restaurant.entity";

@Injectable()
export class RestaurantsService {
  constructor(
    @Inject(PG_CONNECTION) private readonly pg: NodePgDatabase<typeof schema>,
    private readonly timezonesService: TimezonesService,
  ) {}

  private _buildConditions(options: {
    menuId?: string | null;
    ownerId?: string | null;
    search?: string | null;
  }) {
    const { menuId, ownerId, search } = options;

    const conditions: SQL<unknown>[] = [];

    if (menuId && menuId.length > 0) {
      conditions.push(
        exists(
          this.pg
            .select({ id: dishesMenusToRestaurants.restaurantId })
            .from(dishesMenusToRestaurants)
            .where(
              and(
                eq(dishesMenusToRestaurants.dishesMenuId, menuId),
                eq(dishesMenusToRestaurants.restaurantId, restaurants.id),
              ),
            ),
        ),
      );
    }

    if (ownerId && ownerId.length > 0) {
      conditions.push(eq(schema.restaurants.ownerId, ownerId));
    }

    if (search && search.length > 0) {
      conditions.push(ilike(schema.restaurants.name, `%${search}%`));
    }

    return conditions;
  }

  /**
   * Gets total count of restaurants
   * @returns
   */
  public async getTotalCount(options: {
    menuId?: string | null;
    ownerId?: string | null;
    search?: string | null;
  }): Promise<number> {
    const { menuId, ownerId, search } = options;

    const conditions = this._buildConditions({ menuId, ownerId, search });

    const dbQuery = this.pg
      .select({
        value: count(),
      })
      .from(schema.restaurants);

    if (conditions.length > 0) {
      dbQuery.where(and(...conditions));
    }

    const result = await dbQuery;

    return result[0].value;
  }

  /**
   * Find many restaurants
   * @param options
   * @returns
   */
  public async findMany(options: {
    pagination: IPagination;
    worker?: RequestWorker;
    menuId?: string | null;
    ownerId?: string | null;
    search?: string | null;
  }): Promise<RestaurantEntity[]> {
    const { pagination, worker, menuId, ownerId, search } = options;

    const conditions: SQL<unknown>[] = [];

    if (worker) {
      if (worker.role === "OWNER") {
        conditions.push(eq(schema.restaurants.ownerId, worker.id));
      } else if (
        worker.role !== "SYSTEM_ADMIN" &&
        worker.role !== "CHIEF_ADMIN"
      ) {
        if (worker?.workersToRestaurants.length === 0) {
          return [];
        }

        conditions.push(
          inArray(
            schema.restaurants.id,
            worker.workersToRestaurants.map((r) => r.restaurantId),
          ),
        );
      }
    }

    conditions.push(...this._buildConditions({ menuId, ownerId, search }));

    return await this.pg.query.restaurants.findMany({
      ...(conditions.length > 0
        ? {
            where: () => and(...conditions),
          }
        : {}),
      limit: pagination.size,
      offset: pagination.offset,
    });
  }

  /**
   * Find one restaurant by id
   * @param id
   * @returns
   */
  public async findById(
    id: string,
    opts?: {
      worker?: RequestWorker;
    },
  ): Promise<RestaurantEntity> {
    const requestWorker = opts?.worker;

    const conditions: SQL<unknown>[] = [eq(schema.restaurants.id, id)];

    if (requestWorker) {
      if (requestWorker.role === "OWNER") {
        conditions.push(eq(schema.restaurants.ownerId, requestWorker.id));
      } else if (
        requestWorker.role !== "SYSTEM_ADMIN" &&
        requestWorker.role !== "CHIEF_ADMIN"
      ) {
        if (requestWorker?.workersToRestaurants.length === 0) {
          throw new NotFoundException(`Restaurant with id ${id} not found`);
        }

        conditions.push(
          inArray(
            schema.restaurants.id,
            requestWorker.workersToRestaurants.map((r) => r.restaurantId),
          ),
        );
      }
    }

    const data = await this.pg.query.restaurants.findFirst({
      where: and(...conditions),
    });

    if (!data) {
      throw new NotFoundException(`Restaurant with id ${id} not found`);
    }

    return data;
  }

  /**
   * Create a new restaurant
   * @param dto
   * @returns
   */
  public async create(
    dto: CreateRestaurantDto,
    opts?: { worker?: RequestWorker },
  ): Promise<RestaurantEntity> {
    const requestWorker = opts?.worker;

    if (dto.timezone && !this.timezonesService.checkTimezone(dto.timezone)) {
      throw new BadRequestException(
        "errors.restaurants.provided-timezone-cant-be-set",
        {
          property: "timezone",
        },
      );
    }

    const data = await this.pg
      .insert(schema.restaurants)
      .values({
        ...dto,
        ...(requestWorker?.role === "OWNER" && {
          ownerId: requestWorker.id,
        }),
      })
      .returning({
        id: schema.restaurants.id,
      });

    return await this.findById(data[0].id);
  }

  private async validateRestaurantOwnerUnasignment(restaurantId: string) {
    const menus = await this.pg.query.dishesMenusToRestaurants.findMany({
      where: (dishesMenusToRestaurants, { eq }) =>
        eq(dishesMenusToRestaurants.restaurantId, restaurantId),
      columns: {
        dishesMenuId: true,
      },
      limit: 1,
    });

    if (menus.length > 0) {
      throw new BadRequestException(
        "errors.restaurants.restaurant-was-assigned-to-some-owner-menus",
      );
    }
  }

  /**
   * Update a restaurant
   * @param id
   * @param dto
   * @returns
   */
  public async update(
    id: string,
    payload: UpdateRestaurantDto,
    options: { worker: RequestWorker },
  ): Promise<RestaurantEntity> {
    const { worker } = options;
    const { timezone, ownerId, ...rest } = payload;

    const restaurant = await this.pg.query.restaurants.findFirst({
      where: (restaurants, { eq }) => eq(restaurants.id, id),
      columns: {
        ownerId: true,
      },
    });

    if (!restaurant) {
      throw new NotFoundException();
    }

    // If role is owner, only owner can update restaurant
    if (worker.role === "OWNER" && restaurant.ownerId !== worker.id) {
      throw new BadRequestException(
        "errors.restaurants.you-dont-have-rights-to-that-restaurant",
      );
    }

    // If role is admin, only admins of that restaurant can update it
    if (
      worker.role === "ADMIN" &&
      !worker.workersToRestaurants.some((r) => r.restaurantId === id)
    ) {
      throw new BadRequestException(
        "errors.restaurants.you-dont-have-rights-to-that-restaurant",
      );
    }

    if (timezone && !this.timezonesService.checkTimezone(timezone)) {
      throw new BadRequestException(
        "errors.restaurants.provided-timezone-cant-be-set",
        {
          property: "timezone",
        },
      );
    }

    // If trying to unasign restaurant from owner
    if (restaurant.ownerId && ownerId === null) {
      await this.validateRestaurantOwnerUnasignment(id);
    }

    // Disable restaurant if it is closed forever
    if (rest.isClosedForever) {
      rest.isEnabled = false;
    }

    await this.pg
      .update(schema.restaurants)
      .set({
        ...rest,
        ...(timezone ? { timezone } : {}),
        // Only system admins and chief admins can update restaurant owner
        ...(ownerId &&
        (worker.role === "SYSTEM_ADMIN" || worker.role === "CHIEF_ADMIN")
          ? { ownerId }
          : {}),
      })
      .where(eq(schema.restaurants.id, id));

    return await this.findById(id);
  }

  /**
   * Delete a restaurant
   * @param id
   * @returns
   */
  // TODO: implement removement of restaurants
  public async delete(id: string): Promise<void> {
    throw new BadRequestException();
    await this.pg
      .delete(schema.restaurants)
      .where(eq(schema.restaurants.id, id));
  }

  public async isExists(id: string): Promise<boolean> {
    return !!(await this.pg.query.restaurants.findFirst({
      where: eq(schema.restaurants.id, id),
    }));
  }
}
