import * as schema from "@postgress-db/schema";
import { Inject, Injectable } from "@nestjs/common";
import { PG_CONNECTION } from "src/constants";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { and, eq } from "drizzle-orm";
import {
  CreateRestaurantHoursDto,
  RestaurantHoursDto,
  UpdateRestaurantHoursDto,
} from "../dto/restaurant-hours.dto";
import { RestaurantsService } from "./restaurants.service";
import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";

@Injectable()
export class RestaurantHoursService {
  constructor(
    @Inject(PG_CONNECTION) private readonly pg: NodePgDatabase<typeof schema>,
    private readonly restaurantsService: RestaurantsService,
  ) {}

  public async isExists(id: number, restaurantId?: number): Promise<boolean> {
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
  public async findMany(restaurantId: number): Promise<RestaurantHoursDto[]> {
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
  public async findOne(id: number): Promise<RestaurantHoursDto> {
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
      .returning({
        id: schema.restaurantHours.id,
      });

    return await this.findOne(data?.[0].id);
  }

  /**
   * Update restaurant hours
   * @param id
   * @param dto
   * @returns
   */
  public async update(
    id: number,
    dto: UpdateRestaurantHoursDto,
  ): Promise<RestaurantHoursDto> {
    if (!(await this.restaurantsService.isExists(id))) {
      throw new BadRequestException(`Restaurant with id ${id} not found`);
    }

    await this.pg
      .update(schema.restaurantHours)
      .set(dto)
      .where(eq(schema.restaurantHours.id, id));

    return await this.findOne(id);
  }

  /**
   * Delete restaurant hours
   * @param id
   * @returns
   */
  public async delete(
    id: number,
    restaurantId?: number,
  ): Promise<{ id: string }> {
    if (!(await this.isExists(id, restaurantId))) {
      throw new BadRequestException(`Restaurant hours with id ${id} not found`);
    }

    return await this.pg
      .delete(schema.restaurantHours)
      .where(eq(schema.restaurantHours.id, id));
  }
}
