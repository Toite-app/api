import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { Inject, Injectable } from "@nestjs/common";
import { schema } from "@postgress-db/drizzle.module";
import { and, eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";

import { RestaurantsService } from "../@/services/restaurants.service";

import {
  CreateRestaurantHoursDto,
  RestaurantHoursEntity,
  UpdateRestaurantHoursDto,
} from "./entities/restaurant-hours.entity";

@Injectable()
export class RestaurantHoursService {
  constructor(
    @Inject(PG_CONNECTION) private readonly pg: NodePgDatabase<typeof schema>,
    private readonly restaurantsService: RestaurantsService,
  ) {}

  public async isExists(id: string, restaurantId?: string): Promise<boolean> {
    return !!(await this.pg.query.restaurantHours.findFirst({
      where: !restaurantId
        ? eq(schema.restaurantHours.id, id)
        : and(
            eq(schema.restaurantHours.id, id),
            eq(schema.restaurantHours.restaurantId, restaurantId),
          ),
    }));
  }

  /**
   * Find many restaurant hours
   * @param restaurantId
   * @returns
   */
  public async findMany(
    restaurantId: string,
  ): Promise<RestaurantHoursEntity[]> {
    if (!(await this.restaurantsService.isExists(restaurantId))) {
      throw new BadRequestException(
        "errors.restaurants.with-provided-id-doesnt-exist",
        {
          property: "restaurantId",
        },
      );
    }

    return await this.pg.query.restaurantHours.findMany({
      where: eq(schema.restaurantHours.restaurantId, restaurantId),
      orderBy: schema.restaurantHours.dayOfWeek,
    });
  }

  /**
   * Find one restaurant hours
   * @param id
   * @returns
   */
  public async findOne(id: string): Promise<RestaurantHoursEntity | undefined> {
    return await this.pg.query.restaurantHours.findFirst({
      where: eq(schema.restaurantHours.id, id),
    });
  }

  /**
   * Create restaurant hours
   * @param dto
   * @returns
   */
  public async create(
    dto: CreateRestaurantHoursDto,
  ): Promise<RestaurantHoursEntity> {
    if (!(await this.restaurantsService.isExists(dto.restaurantId))) {
      throw new BadRequestException(
        "errors.restaurants.with-provided-id-doesnt-exist",
        {
          property: "restaurantId",
        },
      );
    }

    // Make all previous value with dto.dayOfWeek to disabled
    await this.pg
      .update(schema.restaurantHours)
      .set({ isEnabled: false })
      .where(
        and(
          eq(schema.restaurantHours.restaurantId, dto.restaurantId),
          eq(schema.restaurantHours.dayOfWeek, dto.dayOfWeek),
        ),
      );

    const data = await this.pg
      .insert(schema.restaurantHours)
      .values(dto)
      .returning();

    return data[0];
  }

  /**
   * Update restaurant hours
   * @param id
   * @param dto
   * @returns
   */
  public async update(
    id: string,
    dto: UpdateRestaurantHoursDto,
  ): Promise<RestaurantHoursEntity> {
    if (!(await this.isExists(id))) {
      throw new BadRequestException(`Hour record with id ${id} not found`);
    }

    const data = await this.pg
      .update(schema.restaurantHours)
      .set(dto)
      .where(eq(schema.restaurantHours.id, id))
      .returning();

    return data[0];
  }

  /**
   * Delete restaurant hours
   * @param id
   * @returns
   */
  public async delete(
    id: string,
    restaurantId?: string,
  ): Promise<{ id: string }> {
    if (!(await this.isExists(id, restaurantId))) {
      throw new BadRequestException(
        "errors.restaurant-hours.with-this-id-doesnt-exist",
      );
    }

    const result = await this.pg
      .delete(schema.restaurantHours)
      .where(eq(schema.restaurantHours.id, id))
      .returning();

    return { id: result[0].id };
  }
}
