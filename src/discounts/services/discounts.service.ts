import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { RequestWorker } from "@core/interfaces/request";
import { Inject, Injectable } from "@nestjs/common";
import { schema } from "@postgress-db/drizzle.module";
import {
  discounts,
  discountsToRestaurants,
} from "@postgress-db/schema/discounts";
import { and, eq, exists, inArray, SQL } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";
import { CreateDiscountDto } from "src/discounts/dto/create-discount.dto";
import { UpdateDiscountDto } from "src/discounts/dto/update-discount.dto";
import { DiscountEntity } from "src/discounts/entities/discount.entity";

@Injectable()
export class DiscountsService {
  constructor(
    @Inject(PG_CONNECTION) private readonly pg: NodePgDatabase<typeof schema>,
  ) {}

  public async findMany(options: {
    worker?: RequestWorker;
  }): Promise<DiscountEntity[]> {
    const { worker } = options;

    const conditions: SQL<unknown>[] = [];

    // If worker is not system admin, check if they have access to the discounts
    if (
      worker &&
      worker.role !== "SYSTEM_ADMIN" &&
      worker.role !== "CHIEF_ADMIN"
    ) {
      const restaurantIds =
        worker.role === "OWNER"
          ? worker.ownedRestaurants.map((r) => r.id)
          : worker.workersToRestaurants.map((r) => r.restaurantId);

      conditions.push(
        exists(
          this.pg
            .select({ id: discountsToRestaurants.restaurantId })
            .from(discountsToRestaurants)
            .where(inArray(discountsToRestaurants.restaurantId, restaurantIds)),
        ),
      );
    }

    const fetchedDiscounts = await this.pg.query.discounts.findMany({
      ...(conditions.length > 0 ? { where: () => and(...conditions) } : {}),
      with: {
        discountsToRestaurants: {
          with: {
            restaurant: {
              columns: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return fetchedDiscounts.map(({ discountsToRestaurants, ...discount }) => ({
      ...discount,
      restaurants: discountsToRestaurants.map(({ restaurant }) => ({
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
      })),
    }));
  }

  public async findOne(id: string) {
    const discount = await this.pg.query.discounts.findFirst({
      where: eq(discounts.id, id),
      with: {
        discountsToRestaurants: {
          with: {
            restaurant: true,
          },
        },
      },
    });

    if (!discount) {
      return null;
    }

    return {
      ...discount,
      restaurants: discount.discountsToRestaurants.map(({ restaurant }) => ({
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
      })),
    };
  }

  private async validatePayload(
    payload: CreateDiscountDto | UpdateDiscountDto,
    worker: RequestWorker,
  ) {
    if (!payload.restaurantIds || payload.restaurantIds.length === 0) {
      throw new BadRequestException(
        "errors.discounts.you-should-provide-at-least-one-restaurant-id",
      );
    }

    // If worker is owner, check if they own all provided restaurant ids
    if (worker.role === "SYSTEM_ADMIN" || worker.role === "CHIEF_ADMIN") {
    } else if (worker.role === "OWNER" || worker.role === "ADMIN") {
      const restaurantIdsSet = new Set(
        worker.role === "OWNER"
          ? worker.ownedRestaurants.map((r) => r.id)
          : worker.workersToRestaurants.map((r) => r.restaurantId),
      );

      if (payload.restaurantIds.some((id) => !restaurantIdsSet.has(id))) {
        throw new BadRequestException(
          "errors.discounts.you-provided-restaurant-id-that-you-dont-own",
        );
      }
    }
  }

  public async create(
    payload: CreateDiscountDto,
    options: { worker: RequestWorker },
  ) {
    const { worker } = options;

    await this.validatePayload(payload, worker);

    const discount = await this.pg.transaction(async (tx) => {
      const [discount] = await tx
        .insert(discounts)
        .values({
          ...payload,
          activeFrom: new Date(payload.activeFrom),
          activeTo: new Date(payload.activeTo),
        })
        .returning({
          id: discounts.id,
        });

      await tx.insert(discountsToRestaurants).values(
        payload.restaurantIds.map((id) => ({
          discountId: discount.id,
          restaurantId: id,
        })),
      );

      return discount;
    });

    return await this.findOne(discount.id);
  }

  public async update(
    id: string,
    payload: UpdateDiscountDto,
    options: { worker: RequestWorker },
  ) {
    const { worker } = options;

    const existingDiscount = await this.findOne(id);
    if (!existingDiscount) {
      throw new BadRequestException(
        "errors.discounts.discount-with-provided-id-not-found",
      );
    }

    if (payload.restaurantIds) {
      await this.validatePayload(payload, worker);
    }

    const updatedDiscount = await this.pg.transaction(async (tx) => {
      // Update discount
      const [discount] = await tx
        .update(discounts)
        .set({
          ...payload,
          ...(payload.activeFrom
            ? { activeFrom: new Date(payload.activeFrom) }
            : {}),
          ...(payload.activeTo ? { activeTo: new Date(payload.activeTo) } : {}),
          updatedAt: new Date(),
        })
        .where(eq(discounts.id, id))
        .returning({
          id: discounts.id,
        });

      // If restaurantIds are provided, update restaurant associations
      if (payload.restaurantIds) {
        // Delete existing associations
        await tx
          .delete(discountsToRestaurants)
          .where(eq(discountsToRestaurants.discountId, id));

        // Create new associations
        await tx.insert(discountsToRestaurants).values(
          payload.restaurantIds.map((restaurantId) => ({
            discountId: id,
            restaurantId,
          })),
        );
      }

      return discount;
    });

    return await this.findOne(updatedDiscount.id);
  }
}
