import { ForbiddenException } from "@core/errors/exceptions/forbidden.exception";
import { NotFoundException } from "@core/errors/exceptions/not-found.exception";
import { RequestWorker } from "@core/interfaces/request";
import { Inject, Injectable } from "@nestjs/common";
import { schema } from "@postgress-db/drizzle.module";
import { workshiftPaymentCategories } from "@postgress-db/schema/workshift-payment-category";
import { eq, or } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";
import { CreateWorkshiftPaymentCategoryDto } from "src/restaurants/workshift-payment-categories/dto/create-workshift-payment-category.dto";
import { UpdateWorkshiftPaymentCategoryDto } from "src/restaurants/workshift-payment-categories/dto/update-workshift-payment-category.dto";

@Injectable()
export class RestaurantWorkshiftPaymentCategoriesService {
  constructor(
    @Inject(PG_CONNECTION) private readonly pg: NodePgDatabase<typeof schema>,
  ) {}

  // TODO: implement unified service that will do such checks
  private _checkRestaurantAccess(restaurantId: string, worker: RequestWorker) {
    if (worker.role === "SYSTEM_ADMIN" || worker.role === "CHIEF_ADMIN") {
      return true;
    } else if (worker.role === "OWNER") {
      return worker.ownedRestaurants.some((r) => r.id === restaurantId);
    } else if (worker.role === "ADMIN") {
      return worker.workersToRestaurants.some(
        (r) => r.restaurantId === restaurantId,
      );
    }

    return false;
  }

  async findAll(restaurantId: string, opts: { worker: RequestWorker }) {
    const { worker } = opts;

    if (!this._checkRestaurantAccess(restaurantId, worker)) {
      throw new ForbiddenException();
    }

    const categories = await this.pg.query.workshiftPaymentCategories.findMany({
      where: (category, { eq, and, isNull }) =>
        and(
          eq(category.restaurantId, restaurantId),
          eq(category.isRemoved, false),
          isNull(category.parentId),
        ),
      with: {
        childrens: {
          where: (child, { eq }) => eq(child.isRemoved, false),
        },
      },
    });

    return categories;
  }

  async create(
    payload: CreateWorkshiftPaymentCategoryDto,
    opts: { restaurantId: string; worker: RequestWorker },
  ) {
    const { restaurantId, worker } = opts;

    if (!this._checkRestaurantAccess(restaurantId, worker)) {
      throw new ForbiddenException();
    }

    const [category] = await this.pg
      .insert(workshiftPaymentCategories)
      .values({
        restaurantId,
        ...payload,
      })
      .returning();

    return category;
  }

  async update(
    categoryId: string,
    payload: UpdateWorkshiftPaymentCategoryDto,
    opts: { worker: RequestWorker },
  ) {
    const { worker } = opts;

    const category = await this.pg.query.workshiftPaymentCategories.findFirst({
      where: (category, { and, eq }) =>
        and(eq(category.id, categoryId), eq(category.isRemoved, false)),
      columns: {
        restaurantId: true,
      },
    });

    if (!category) {
      throw new NotFoundException();
    }

    await this._checkRestaurantAccess(category.restaurantId, worker);

    const [editedCategory] = await this.pg
      .update(workshiftPaymentCategories)
      .set(payload)
      .where(eq(workshiftPaymentCategories.id, categoryId))
      .returning();

    return editedCategory;
  }

  async remove(categoryId: string, opts: { worker: RequestWorker }) {
    const { worker } = opts;

    const category = await this.pg.query.workshiftPaymentCategories.findFirst({
      where: (category, { and, eq }) =>
        and(eq(category.id, categoryId), eq(category.isRemoved, false)),
      columns: {
        restaurantId: true,
      },
    });

    if (!category) {
      throw new NotFoundException();
    }

    if (!this._checkRestaurantAccess(category.restaurantId, worker)) {
      throw new ForbiddenException();
    }

    const [removedCategory] = await this.pg
      .update(workshiftPaymentCategories)
      .set({
        isRemoved: true,
        removedAt: new Date(),
      })
      .where(
        or(
          eq(workshiftPaymentCategories.id, categoryId),
          eq(workshiftPaymentCategories.parentId, categoryId),
        ),
      )
      .returning();

    return removedCategory;
  }
}
