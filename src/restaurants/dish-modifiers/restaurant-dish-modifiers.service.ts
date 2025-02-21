import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { Inject, Injectable } from "@nestjs/common";
import { schema } from "@postgress-db/drizzle.module";
import { and, eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";

import { RestaurantsService } from "../@/services/restaurants.service";

import { CreateRestaurantDishModifierDto } from "./dto/create-restaurant-dish-modifier.dto";
import { UpdateRestaurantDishModifierDto } from "./dto/update-restraurant-dish-modifier.dto";
import { RestaurantDishModifierEntity } from "./entities/restaurant-dish-modifier.entity";

@Injectable()
export class RestaurantDishModifiersService {
  constructor(
    @Inject(PG_CONNECTION) private readonly pg: NodePgDatabase<typeof schema>,
    private readonly restaurantsService: RestaurantsService,
  ) {}

  private async isExists(id: string, restaurantId?: string): Promise<boolean> {
    return !!(await this.pg.query.dishModifiers.findFirst({
      where: !restaurantId
        ? eq(schema.dishModifiers.id, id)
        : and(
            eq(schema.dishModifiers.id, id),
            eq(schema.dishModifiers.restaurantId, restaurantId),
          ),
    }));
  }

  /**
   * Find many restaurant dish modifiers
   * @param restaurantId
   * @returns Array of dish modifiers
   */
  public async findMany(
    restaurantId: string,
  ): Promise<RestaurantDishModifierEntity[]> {
    if (!(await this.restaurantsService.isExists(restaurantId))) {
      throw new BadRequestException(
        "errors.restaurants.with-provided-id-doesnt-exist",
        {
          property: "restaurantId",
        },
      );
    }

    return await this.pg.query.dishModifiers.findMany({
      where: and(
        eq(schema.dishModifiers.restaurantId, restaurantId),
        eq(schema.dishModifiers.isRemoved, false),
      ),
    });
  }

  /**
   * Create restaurant dish modifier
   * @param dto
   * @returns Created dish modifier
   */
  public async create(
    dto: CreateRestaurantDishModifierDto,
  ): Promise<RestaurantDishModifierEntity> {
    if (!(await this.restaurantsService.isExists(dto.restaurantId))) {
      throw new BadRequestException(
        "errors.restaurants.with-provided-id-doesnt-exist",
        {
          property: "restaurantId",
        },
      );
    }

    const data = await this.pg
      .insert(schema.dishModifiers)
      .values(dto)
      .returning();

    return data[0];
  }

  /**
   * Update restaurant dish modifier
   * @param id
   * @param dto
   * @returns Updated dish modifier
   */
  public async update(
    id: string,
    dto: UpdateRestaurantDishModifierDto,
  ): Promise<RestaurantDishModifierEntity> {
    if (!(await this.isExists(id))) {
      throw new BadRequestException(
        "errors.restaurant-dish-modifiers.with-this-id-doesnt-exist",
      );
    }

    const data = await this.pg
      .update(schema.dishModifiers)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(schema.dishModifiers.id, id))
      .returning();

    return data[0];
  }

  /**
   * Mark dish modifier as removed
   * @param id
   * @param restaurantId
   * @returns Removed dish modifier id
   */
  public async remove(
    id: string,
    restaurantId?: string,
  ): Promise<{ id: string }> {
    if (!(await this.isExists(id, restaurantId))) {
      throw new BadRequestException(
        "errors.restaurant-dish-modifiers.with-this-id-doesnt-exist",
      );
    }

    const result = await this.pg
      .update(schema.dishModifiers)
      .set({
        isRemoved: true,
        removedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.dishModifiers.id, id))
      .returning();

    return { id: result[0].id };
  }
}
