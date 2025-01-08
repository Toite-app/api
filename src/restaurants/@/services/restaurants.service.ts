import { IPagination } from "@core/decorators/pagination.decorator";
import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { NotFoundException } from "@core/errors/exceptions/not-found.exception";
import { Inject, Injectable } from "@nestjs/common";
import { schema } from "@postgress-db/drizzle.module";
import { count, eq } from "drizzle-orm";
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
  }): Promise<RestaurantEntity[]> {
    return await this.pg.query.restaurants.findMany({
      limit: options.pagination.size,
      offset: options.pagination.offset,
    });
  }

  /**
   * Find one restaurant by id
   * @param id
   * @returns
   */
  public async findById(id: string): Promise<RestaurantEntity> {
    const data = await this.pg.query.restaurants.findFirst({
      where: eq(schema.restaurants.id, id),
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
  public async create(dto: CreateRestaurantDto): Promise<RestaurantEntity> {
    if (dto.timezone && !this.timezonesService.checkTimezone(dto.timezone)) {
      throw new BadRequestException({
        title: "Provided timezone can't be set",
      });
    }

    const data = await this.pg
      .insert(schema.restaurants)
      .values(dto)
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
      throw new BadRequestException({
        title: "Provided timezone can't be set",
      });
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
