import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { Inject, Injectable } from "@nestjs/common";
import { schema } from "@postgress-db/drizzle.module";
import {
  restaurantWorkshops,
  workshopWorkers,
} from "@postgress-db/schema/restaurant-workshop";
import { workers } from "@postgress-db/schema/workers";
import { and, eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";

import { RestaurantsService } from "../@/services/restaurants.service";

import { WorkshopWorkerEntity } from "./entity/restaurant-workshop-worker.entity";
import {
  CreateRestaurantWorkshopDto,
  RestaurantWorkshopDto,
  UpdateRestaurantWorkshopDto,
} from "./entity/restaurant-workshop.entity";

@Injectable()
export class RestaurantWorkshopsService {
  constructor(
    @Inject(PG_CONNECTION) private readonly pg: NodePgDatabase<typeof schema>,
    private readonly restaurantsService: RestaurantsService,
  ) {}

  public async isExists(id: string, restaurantId?: string): Promise<boolean> {
    return !!(await this.pg.query.restaurantWorkshops.findFirst({
      where: !restaurantId
        ? eq(restaurantWorkshops.id, id)
        : and(
            eq(restaurantWorkshops.id, id),
            eq(restaurantWorkshops.restaurantId, restaurantId),
          ),
    }));
  }

  /**
   * Find many restaurant workshops
   * @param restaurantId
   * @returns
   */
  public async findMany(
    restaurantId: string,
  ): Promise<RestaurantWorkshopDto[]> {
    if (!(await this.restaurantsService.isExists(restaurantId))) {
      throw new BadRequestException(
        `Restaurant with id ${restaurantId} not found`,
      );
    }

    return await this.pg.query.restaurantWorkshops.findMany({
      where: eq(restaurantWorkshops.restaurantId, restaurantId),
    });
  }

  /**
   * Find one restaurant workshop
   * @param id
   * @returns
   */
  public async findOne(id: string): Promise<RestaurantWorkshopDto | undefined> {
    return await this.pg.query.restaurantWorkshops.findFirst({
      where: eq(restaurantWorkshops.id, id),
    });
  }

  /**
   * Create restaurant workshop
   * @param dto
   * @returns
   */
  public async create(
    dto: CreateRestaurantWorkshopDto,
  ): Promise<RestaurantWorkshopDto> {
    if (!(await this.restaurantsService.isExists(dto.restaurantId))) {
      throw new BadRequestException(
        `Restaurant with id ${dto.restaurantId} not found`,
      );
    }

    const data = await this.pg
      .insert(restaurantWorkshops)
      .values(dto)
      .returning();

    return data[0];
  }

  /**
   * Update restaurant workshop
   * @param id
   * @param dto
   * @returns
   */
  public async update(
    id: string,
    dto: UpdateRestaurantWorkshopDto,
  ): Promise<RestaurantWorkshopDto> {
    if (!(await this.isExists(id))) {
      throw new BadRequestException(
        `Restaurant workshop with id ${id} not found`,
      );
    }

    const data = await this.pg
      .update(restaurantWorkshops)
      .set(dto)
      .where(eq(restaurantWorkshops.id, id))
      .returning();

    return data[0];
  }

  /**
   * Delete restaurant workshop
   * @param id
   * @returns
   */
  public async delete(
    id: string,
    restaurantId?: string,
  ): Promise<{ id: string }> {
    if (!(await this.isExists(id, restaurantId))) {
      throw new BadRequestException(
        `Restaurant workshop with id ${id} not found`,
      );
    }

    const result = await this.pg
      .delete(restaurantWorkshops)
      .where(eq(restaurantWorkshops.id, id))
      .returning();

    return { id: result[0].id };
  }

  /**
   * Get workshop workers
   * @param workshopId
   * @returns
   */
  public async getWorkers(workshopId: string): Promise<WorkshopWorkerEntity[]> {
    if (!(await this.isExists(workshopId))) {
      throw new BadRequestException(
        `Restaurant workshop with id ${workshopId} not found`,
      );
    }

    const result = await this.pg
      .select({
        workerId: workers.id,
        name: workers.name,
        login: workers.login,
        role: workers.role,
      })
      .from(workshopWorkers)
      .innerJoin(workers, eq(workshopWorkers.workerId, workers.id))
      .where(eq(workshopWorkers.workshopId, workshopId));

    return result;
  }

  /**
   * Update workshop workers
   * @param workshopId
   * @param workerIds
   * @returns
   */
  public async updateWorkers(
    workshopId: string,
    workerIds: string[],
  ): Promise<void> {
    if (!(await this.isExists(workshopId))) {
      throw new BadRequestException(
        `Restaurant workshop with id ${workshopId} not found`,
      );
    }

    // Delete all existing assignments for this workshop
    await this.pg
      .delete(workshopWorkers)
      .where(eq(workshopWorkers.workshopId, workshopId));

    // If there are workers to assign, insert them
    if (workerIds.length > 0) {
      await this.pg.insert(workshopWorkers).values(
        workerIds.map((workerId) => ({
          workshopId,
          workerId,
        })),
      );
    }
  }
}
