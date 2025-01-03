import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { Inject, Injectable } from "@nestjs/common";
import { schema } from "@postgress-db/drizzle.module";
import { and, eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";

import {
  CreateRestaurantHoursDto,
  RestaurantHoursDto,
  UpdateRestaurantHoursDto,
} from "../dto/restaurant-hours.dto";

import { RestaurantsService } from "./restaurants.service";

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
  public async findMany(restaurantId: string): Promise<RestaurantHoursDto[]> {
    if (!(await this.restaurantsService.isExists(restaurantId))) {
      throw new BadRequestException(
        `Restaurant with id ${restaurantId} not found`,
      );
    }

    return await this.pg.query.restaurantHours.findMany({
      where: eq(schema.restaurantHours.restaurantId, restaurantId),
    });
  }

  /**
   * Find one restaurant hours
   * @param id
   * @returns
   */
  public async findOne(id: string): Promise<RestaurantHoursDto | undefined> {
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
  ): Promise<RestaurantHoursDto> {
    if (!(await this.restaurantsService.isExists(dto.restaurantId))) {
      throw new BadRequestException(
        `Restaurant with id ${dto.restaurantId} not found`,
      );
    }

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
  ): Promise<RestaurantHoursDto> {
    if (!(await this.restaurantsService.isExists(id))) {
      throw new BadRequestException(`Restaurant with id ${id} not found`);
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
      throw new BadRequestException(`Restaurant hours with id ${id} not found`);
    }

    const result = await this.pg
      .delete(schema.restaurantHours)
      .where(eq(schema.restaurantHours.id, id))
      .returning();

    return { id: result[0].id };
  }
}
