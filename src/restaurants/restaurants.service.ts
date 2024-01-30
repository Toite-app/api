import { Inject, Injectable } from "@nestjs/common";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";
import * as schema from "@postgress-db/schema";
import { count, eq } from "drizzle-orm";
import { RestaurantDto } from "./dto/restaurant.dto";
import { IPagination } from "@core/decorators/pagination.decorator";
import { CreateRestaurantDto } from "./dto/create-restaurant.dto";
import { NotFoundException } from "@core/errors/exceptions/not-found.exception";
import { UpdateRestaurantDto } from "./dto/update-restaurant.dto";

@Injectable()
export class RestaurantsService {
  constructor(
    @Inject(PG_CONNECTION) private readonly pg: NodePgDatabase<typeof schema>,
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
  }): Promise<RestaurantDto[]> {
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
  public async findById(id: number): Promise<RestaurantDto> {
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
  public async create(dto: CreateRestaurantDto): Promise<RestaurantDto> {
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
    id: number,
    dto: UpdateRestaurantDto,
  ): Promise<RestaurantDto> {
    await this.pg
      .update(schema.restaurants)
      .set(dto)
      .where(eq(schema.restaurants.id, id));

    return await this.findById(id);
  }
}
