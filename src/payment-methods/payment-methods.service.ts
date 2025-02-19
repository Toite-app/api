import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { RequestWorker } from "@core/interfaces/request";
import { Inject, Injectable } from "@nestjs/common";
import { schema } from "@postgress-db/drizzle.module";
import { paymentMethods } from "@postgress-db/schema/payment-methods";
import { eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { EncryptionService } from "src/@base/encryption/encryption.service";
import { PG_CONNECTION } from "src/constants";
import { CreatePaymentMethodDto } from "src/payment-methods/dto/create-payment-method.dto";
import { UpdatePaymentMethodDto } from "src/payment-methods/dto/update-payment-method.dto";

@Injectable()
export class PaymentMethodsService {
  constructor(
    @Inject(PG_CONNECTION)
    private readonly pg: NodePgDatabase<typeof schema>,
    private readonly encryptionService: EncryptionService,
  ) {}

  private async checkAccessRights(
    restaurantId: string,
    worker?: RequestWorker,
  ): Promise<void> {
    if (!worker) return;

    // System admin and chief admin have full access
    if (worker.role === "SYSTEM_ADMIN" || worker.role === "CHIEF_ADMIN") {
      return;
    }

    const restaurant = await this.pg.query.restaurants.findFirst({
      where: (restaurants, { eq }) => eq(restaurants.id, restaurantId),
      columns: {
        id: true,
        ownerId: true,
      },
    });

    if (!restaurant) {
      throw new BadRequestException(
        "errors.payment-methods.restaurant-not-found",
      );
    }

    switch (worker.role) {
      case "OWNER":
        if (worker.id !== restaurant.ownerId) {
          throw new BadRequestException(
            "errors.payment-methods.not-enough-rights",
          );
        }
        break;
      case "ADMIN":
        if (
          !worker.workersToRestaurants.some(
            (r) => r.restaurantId === restaurant.id,
          )
        ) {
          throw new BadRequestException(
            "errors.payment-methods.not-enough-rights",
          );
        }
        break;
      default:
        throw new BadRequestException(
          "errors.payment-methods.not-enough-rights",
        );
    }
  }

  async findMany(options: { restaurantId: string }) {
    return await this.pg.query.paymentMethods.findMany({
      where: (paymentMethods, { eq }) =>
        eq(paymentMethods.restaurantId, options.restaurantId),
    });
  }

  async create(
    payload: CreatePaymentMethodDto,
    opts?: { worker: RequestWorker },
  ) {
    const { type, secretId, secretKey, restaurantId } = payload;

    await this.checkAccessRights(restaurantId, opts?.worker);

    if (type === "YOO_KASSA" && (!secretId || !secretKey)) {
      throw new BadRequestException(
        "errors.payment-methods.secret-id-and-secret-key-are-required",
      );
    }

    return await this.pg
      .insert(paymentMethods)
      .values({
        ...payload,
        ...(secretId &&
          secretKey && {
            secretId,
            secretKey: await this.encryptionService.encrypt(secretKey),
          }),
      })
      .returning();
  }

  async update(
    id: string,
    payload: UpdatePaymentMethodDto,
    opts?: { worker: RequestWorker },
  ) {
    const paymentMethod = await this.pg.query.paymentMethods.findFirst({
      where: (methods, { eq }) => eq(methods.id, id),
      columns: {
        restaurantId: true,
      },
    });

    if (!paymentMethod) {
      throw new BadRequestException("errors.payment-methods.not-found");
    }

    await this.checkAccessRights(paymentMethod.restaurantId, opts?.worker);

    return await this.pg
      .update(paymentMethods)
      .set(payload)
      .where(eq(paymentMethods.id, id))
      .returning();
  }
}
