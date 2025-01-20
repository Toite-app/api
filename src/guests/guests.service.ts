import { IFilters } from "@core/decorators/filter.decorator";
import {
  IPagination,
  PAGINATION_DEFAULT_LIMIT,
} from "@core/decorators/pagination.decorator";
import { ISorting } from "@core/decorators/sorting.decorator";
import { BadRequestException } from "@core/errors/exceptions/bad-request.exception";
import { ServerErrorException } from "@core/errors/exceptions/server-error.exception";
import { Inject, Injectable } from "@nestjs/common";
import { DrizzleUtils } from "@postgress-db/drizzle-utils";
import { schema } from "@postgress-db/drizzle.module";
import { asc, count, desc, eq, sql } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { isValidPhoneNumber, parsePhoneNumber } from "libphonenumber-js";
import { PG_CONNECTION } from "src/constants";
import { CreateGuestDto } from "src/guests/dtos/create-guest.dto";
import { UpdateGuestDto } from "src/guests/dtos/update-guest.dto";
import { GuestEntity } from "src/guests/entities/guest.entity";

@Injectable()
export class GuestsService {
  constructor(
    @Inject(PG_CONNECTION) private readonly pg: NodePgDatabase<typeof schema>,
  ) {}

  public async getTotalCount(filters?: IFilters): Promise<number> {
    const query = this.pg
      .select({
        value: count(),
      })
      .from(schema.guests);

    if (filters) {
      query.where(DrizzleUtils.buildFilterConditions(schema.guests, filters));
    }

    return await query.then((res) => res[0].value);
  }

  public async findMany(options?: {
    pagination?: IPagination;
    sorting?: ISorting;
    filters?: IFilters;
  }): Promise<GuestEntity[]> {
    const { pagination, sorting, filters } = options ?? {};

    const query = this.pg.select().from(schema.guests);

    if (filters) {
      query.where(DrizzleUtils.buildFilterConditions(schema.guests, filters));
    }

    if (sorting) {
      query.orderBy(
        sorting.sortOrder === "asc"
          ? asc(sql.identifier(sorting.sortBy))
          : desc(sql.identifier(sorting.sortBy)),
      );
    }

    return await query
      .limit(pagination?.size ?? PAGINATION_DEFAULT_LIMIT)
      .offset(pagination?.offset ?? 0);
  }

  private formatPhoneNumber(phone: string): string {
    try {
      const phoneNumber = parsePhoneNumber(phone);
      if (!phoneNumber || !isValidPhoneNumber(phone)) {
        throw new BadRequestException("errors.common.invalid-phone-number", {
          property: "phone",
        });
      }
      // Format to E.164 format (e.g., +12133734253)
      return phoneNumber.format("E.164");
    } catch (error) {
      throw new BadRequestException(
        "errors.common.invalid-phone-number-format",
        {
          property: "phone",
        },
      );
    }
  }

  public async create(dto: CreateGuestDto): Promise<GuestEntity | undefined> {
    const formattedPhone = this.formatPhoneNumber(dto.phone);

    const guests = await this.pg
      .insert(schema.guests)
      .values({
        ...dto,
        phone: formattedPhone,
        lastVisitAt: new Date(),
        bonusBalance: dto.bonusBalance ?? 0,
      })
      .returning();

    const guest = guests[0];
    if (!guest) {
      throw new ServerErrorException("errors.guests.failed-to-create-guest");
    }

    return guest;
  }

  public async update(
    id: string,
    dto: UpdateGuestDto,
  ): Promise<GuestEntity | undefined> {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException(
        "errors.common.atleast-one-field-should-be-provided",
      );
    }

    // Format phone number if it's included in the update
    const updateData = dto.phone
      ? { ...dto, phone: this.formatPhoneNumber(dto.phone) }
      : dto;

    await this.pg
      .update(schema.guests)
      .set(updateData)
      .where(eq(schema.guests.id, id));

    const result = await this.pg
      .select()
      .from(schema.guests)
      .where(eq(schema.guests.id, id))
      .limit(1);

    return result[0];
  }

  public async remove() {}

  public async findById(id: string): Promise<GuestEntity | undefined> {
    const result = await this.pg
      .select()
      .from(schema.guests)
      .where(eq(schema.guests.id, id))
      .limit(1);

    return result?.[0];
  }

  public async findByPhoneNumber(
    phone?: string | null,
  ): Promise<GuestEntity | undefined> {
    if (!phone) {
      return undefined;
    }

    const formattedPhone = this.formatPhoneNumber(phone);

    const result = await this.pg
      .select()
      .from(schema.guests)
      .where(eq(schema.guests.phone, formattedPhone))
      .limit(1);

    return result?.[0];
  }
}
