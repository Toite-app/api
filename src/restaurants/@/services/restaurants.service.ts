import { IPagination } from "@core/decorators/pagination.decorator";
import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { NotFoundException } from "@core/errors/exceptions/not-found.exception";
import { RequestWorker } from "@core/interfaces/request";
import { Inject, Injectable } from "@nestjs/common";
import { schema } from "@postgress-db/drizzle.module";
import { and, count, eq, inArray, SQL } from "drizzle-orm";
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

  /**
   * Gets total count of restaurants
   * @returns
   */
  public async getTotalCount(): Promise<number> {
    return await this.pg
      .select({ value: count() })
      .from(schema.restaurants)
      .then((res) => res[0].value);
  }

  /**
   * Find many restaurants
   * @param options
   * @returns
   */
  public async findMany(options: {
    pagination: IPagination;
    worker?: RequestWorker;
  }): Promise<RestaurantEntity[]> {
    const { pagination, worker } = options;

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

    return await this.pg.query.restaurants.findMany({
      ...(conditions.length > 0 ? { where: () => and(...conditions) } : {}),
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
        ...(requestWorker?.role === "OWNER" && { ownerId: requestWorker.id }),
      })
      .returning({
        id: schema.restaurants.id,
      });

    return await this.findById(data[0].id);
  }

  /**
   * Update a restaurant
   * @param id
   * @param dto
   * @returns
   */
  public async update(
    id: string,
    dto: UpdateRestaurantDto,
  ): Promise<RestaurantEntity> {
    if (dto.timezone && !this.timezonesService.checkTimezone(dto.timezone)) {
      throw new BadRequestException(
        "errors.restaurants.provided-timezone-cant-be-set",
        {
          property: "timezone",
        },
      );
    }

    // Disable restaurant if it is closed forever
    if (dto.isClosedForever) {
      dto.isEnabled = false;
    }

    await this.pg
      .update(schema.restaurants)
      .set(dto)
      .where(eq(schema.restaurants.id, id));

    return await this.findById(id);
  }

  /**
   * Delete a restaurant
   * @param id
   * @returns
   */

  public async delete(id: string): Promise<void> {
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
