import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { RequestWorker } from "@core/interfaces/request";
import { Inject, Injectable } from "@nestjs/common";
import { schema } from "@postgress-db/drizzle.module";
import { workshiftPaymentCategories } from "@postgress-db/schema/workshift-payment-category";
import { workshiftPayments } from "@postgress-db/schema/workshift-payments";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PG_CONNECTION } from "src/constants";
import { WorkshiftEntity } from "src/workshifts/@/entity/workshift.entity";
import { CreateWorkshiftPaymentDto } from "src/workshifts/payments/dto/create-workshift-payment.dto";
import { WorkshiftPaymentEntity } from "src/workshifts/payments/entity/workshift-payment.entity";

@Injectable()
export class WorkshiftPaymentsService {
  constructor(
    @Inject(PG_CONNECTION) private readonly pg: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Checks if the worker has enough rights to manipulate with workshift
   * @param workshift - The workshift to check rights for
   * @param worker - The worker to check rights for
   */
  private async _checkRights(
    workshift: Pick<WorkshiftEntity, "restaurantId" | "closedAt">,
    worker: RequestWorker,
  ) {
    // SYSTEM_ADMIN or CHIEF_ADMIN can do anything
    if (worker.role === "SYSTEM_ADMIN" || worker.role === "CHIEF_ADMIN") {
    }
    // CHECK OWNERSHIP
    else if (worker.role === "OWNER") {
      if (
        !worker.ownedRestaurants.some((r) => r.id === workshift.restaurantId)
      ) {
        throw new BadRequestException(
          "errors.workshift-payments.not-enough-rights",
        );
      }
    }
    // CHECK ASSIGNMENT
    else if (worker.role === "ADMIN" || worker.role === "CASHIER") {
      if (
        !worker.workersToRestaurants.some(
          (r) => r.restaurantId === workshift.restaurantId,
        )
      ) {
        throw new BadRequestException(
          "errors.workshift-payments.not-enough-rights",
        );
      }

      // Only admins and owner can manipulate with closed workshifts
      if (worker.role === "CASHIER" && workshift.closedAt) {
        throw new BadRequestException(
          "errors.workshift-payments.workshift-already-closed",
        );
      }
    } else {
      throw new BadRequestException(
        "errors.workshift-payments.not-enough-rights",
      );
    }
  }

  /**
   * Finds all workshift payments for a given workshift
   * @param options - The options to find the workshift payments
   * @returns The found workshift payments
   */
  async findMany(options: {
    worker: RequestWorker;
    workshiftId: string;
  }): Promise<WorkshiftPaymentEntity[]> {
    const { worker, workshiftId } = options;

    const workshift = await this.pg.query.workshifts.findFirst({
      where: (workshift, { eq }) => eq(workshift.id, workshiftId),
      columns: {
        restaurantId: true,
        closedAt: true,
      },
    });

    if (!workshift) {
      throw new BadRequestException(
        "errors.workshift-payments.workshift-not-found",
      );
    }

    // Check rights
    await this._checkRights(workshift, worker);

    const payments = await this.pg.query.workshiftPayments.findMany({
      where: (payment, { eq }) => eq(payment.workshiftId, workshiftId),
      with: {
        category: {
          with: {
            parent: {
              columns: {
                name: true,
              },
            },
          },
          columns: {
            name: true,
            parentId: true,
          },
        },
      },
    });

    return payments;
  }

  /**
   * Creates a new workshift payment
   * @param payload - The payload to create the workshift payment
   * @param worker - The worker to create the workshift payment
   * @returns The created workshift payment
   */
  async create(
    payload: CreateWorkshiftPaymentDto & { workshiftId: string },
    { worker }: { worker: RequestWorker },
  ) {
    const { workshiftId } = payload;

    const workshift = await this.pg.query.workshifts.findFirst({
      where: (workshift, { eq }) => eq(workshift.id, workshiftId),
      columns: {
        restaurantId: true,
        closedAt: true,
      },
    });

    if (!workshift) {
      throw new BadRequestException(
        "errors.workshift-payments.workshift-not-found",
      );
    }

    // Check rights
    await this._checkRights(workshift, worker);

    const paymentCategory =
      await this.pg.query.workshiftPaymentCategories.findFirst({
        where: (paymentCategory, { and, eq, notExists }) =>
          and(
            eq(paymentCategory.id, payload.categoryId),
            notExists(
              this.pg
                .select({
                  id: workshiftPaymentCategories.id,
                })
                .from(workshiftPaymentCategories)
                .where(
                  eq(workshiftPaymentCategories.parentId, paymentCategory.id),
                ),
            ),
          ),

        columns: {
          type: true,
        },
      });

    if (!paymentCategory) {
      throw new BadRequestException(
        "errors.workshift-payments.payment-category-not-found",
      );
    }

    const { categoryId, amount, currency, note } = payload;

    const [payment] = await this.pg
      .insert(workshiftPayments)
      .values({
        categoryId,
        type: paymentCategory.type,
        amount,
        currency,
        note,
        workshiftId,
        workerId: worker.id,
      })
      .returning();

    return payment;
  }
}
