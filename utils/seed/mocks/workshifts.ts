import { faker } from "@faker-js/faker";
import { WorkshiftPaymentType } from "src/@base/drizzle/schema/workshift-enums";
import { IWorkshiftStatus } from "src/@base/drizzle/schema/workshifts";
import { v4 as uuidv4 } from "uuid";

import {
  CHILD_CATEGORY_SPECIFIERS,
  PAYMENT_AMOUNT_RANGES,
  WORKSHIFT_PAYMENT_CATEGORY_NAMES,
} from "../data/workshift-categories";
import { schema } from "../db";

export type WorkshiftPaymentCategory =
  typeof schema.workshiftPaymentCategories.$inferInsert;

export interface MockWorkshiftPaymentCategoriesOptions {
  restaurantId: string;
  minPerType: number;
  maxPerType: number;
  maxChildrenPerParent: number;
}

export function mockWorkshiftPaymentCategories(
  opts: MockWorkshiftPaymentCategoriesOptions,
): WorkshiftPaymentCategory[] {
  const { restaurantId, minPerType, maxPerType, maxChildrenPerParent } = opts;

  const categories: WorkshiftPaymentCategory[] = [];

  // Process each payment type (INCOME, EXPENSE, CASHLESS)
  const paymentTypes = [
    WorkshiftPaymentType.INCOME,
    WorkshiftPaymentType.EXPENSE,
    WorkshiftPaymentType.CASHLESS,
  ];

  for (const type of paymentTypes) {
    // Determine how many categories for this type
    const count = faker.number.int({ min: minPerType, max: maxPerType });

    // Get available category names for this type
    const availableNames = [...WORKSHIFT_PAYMENT_CATEGORY_NAMES[type]];

    // Select random category names (without replacement)
    const selectedNames = faker.helpers.arrayElements(availableNames, {
      min: count,
      max: count,
    });

    // Create root categories first
    const rootCategories: WorkshiftPaymentCategory[] = selectedNames.map(
      (name, index) => ({
        id: uuidv4(),
        restaurantId,
        type,
        name,
        description: null,
        sortIndex: categories.length + index,
        isActive: true,
        isRemoved: false,
      }),
    );

    categories.push(...rootCategories);

    // For some root categories, create child categories
    for (const parent of rootCategories) {
      // 50% chance to have children
      if (faker.datatype.boolean()) {
        const childCount = faker.number.int({
          min: 1,
          max: maxChildrenPerParent,
        });

        // Generate child categories with specifiers
        const specifiers = faker.helpers.arrayElements(
          CHILD_CATEGORY_SPECIFIERS,
          {
            min: childCount,
            max: childCount,
          },
        );

        for (const specifier of specifiers) {
          categories.push({
            id: uuidv4(),
            parentId: parent.id,
            restaurantId,
            type,
            name: `${specifier} ${parent.name}`,
            description: null,
            sortIndex: categories.length,
            isActive: true,
            isRemoved: false,
          });
        }
      }
    }
  }

  return categories;
}

export type Workshift = typeof schema.workshifts.$inferInsert;

export interface MockWorkshiftsOptions {
  restaurants: Array<{ id: string; currency: string }>;
  historyDays: number;
  restaurantWorkersMap: Map<string, string[]>;
}

export function mockWorkshifts(opts: MockWorkshiftsOptions): Workshift[] {
  const { restaurants, historyDays, restaurantWorkersMap } = opts;

  const workshifts: Workshift[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today

  for (const restaurant of restaurants) {
    // Get workers for this restaurant (CASHIER/ADMIN only)
    const restaurantWorkers = restaurantWorkersMap.get(restaurant.id);

    // Skip if no suitable workers
    if (!restaurantWorkers || restaurantWorkers.length === 0) {
      continue;
    }

    // Generate workshifts for each day (from historyDays ago to today)
    for (let daysAgo = historyDays - 1; daysAgo >= 0; daysAgo--) {
      const workshiftDate = new Date(today);
      workshiftDate.setDate(today.getDate() - daysAgo);

      const isToday = daysAgo === 0;

      // Opening time: 10:00 AM
      const openedAt = new Date(workshiftDate);
      openedAt.setHours(10, 0, 0, 0);

      // Closing time: 11:00 PM (only for historical workshifts)
      const closedAt = isToday ? null : new Date(workshiftDate);
      if (closedAt) {
        closedAt.setHours(23, 0, 0, 0);
      }

      // Select random workers
      const openedByWorkerId = faker.helpers.arrayElement(restaurantWorkers);
      const closedByWorkerId = isToday
        ? null
        : faker.helpers.arrayElement(restaurantWorkers);

      workshifts.push({
        id: uuidv4(),
        status: isToday ? IWorkshiftStatus.OPENED : IWorkshiftStatus.CLOSED,
        restaurantId: restaurant.id,
        openedByWorkerId,
        closedByWorkerId,
        openedAt,
        closedAt,
      });
    }
  }

  return workshifts;
}

export type WorkshiftPayment = typeof schema.workshiftPayments.$inferInsert;

export interface MockWorkshiftPaymentsOptions {
  workshifts: Array<{
    id: string;
    restaurantId: string;
    status: string;
    openedAt: Date | null;
    closedAt: Date | null;
  }>;
  restaurantCategoriesMap: Map<string, Map<WorkshiftPaymentType, string[]>>;
  restaurantWorkersMap: Map<string, string[]>;
  minPaymentsPerType: number;
  maxPaymentsPerType: number;
  removalRate: number;
}

export function mockWorkshiftPayments(
  opts: MockWorkshiftPaymentsOptions,
): WorkshiftPayment[] {
  const {
    workshifts,
    restaurantCategoriesMap,
    restaurantWorkersMap,
    minPaymentsPerType,
    maxPaymentsPerType,
    removalRate,
  } = opts;

  const payments: WorkshiftPayment[] = [];

  for (const workshift of workshifts) {
    const restaurantWorkers = restaurantWorkersMap.get(workshift.restaurantId);
    const categoriesMap = restaurantCategoriesMap.get(workshift.restaurantId);

    // Skip if no workers or categories
    if (!restaurantWorkers || !categoriesMap) {
      continue;
    }

    // Determine time window for payment creation
    const now = new Date();
    const startTime = workshift.openedAt ?? now;
    // For open workshifts, use the later of openedAt or now
    const endTime = workshift.closedAt ?? (startTime > now ? startTime : now);

    // Generate payments for each type
    const paymentTypes = [
      WorkshiftPaymentType.INCOME,
      WorkshiftPaymentType.EXPENSE,
      WorkshiftPaymentType.CASHLESS,
    ];

    for (const type of paymentTypes) {
      const categories = categoriesMap.get(type);
      if (!categories || categories.length === 0) {
        continue;
      }

      const paymentCount = faker.number.int({
        min: minPaymentsPerType,
        max: maxPaymentsPerType,
      });

      for (let i = 0; i < paymentCount; i++) {
        // Select random category
        const categoryId = faker.helpers.arrayElement(categories);

        // Generate realistic amount based on type
        const amountRange = PAYMENT_AMOUNT_RANGES[type];
        const amount = faker.number
          .float({
            min: amountRange.min,
            max: amountRange.max,
            precision: 2,
          })
          .toFixed(2);

        // Random worker as creator
        const workerId = faker.helpers.arrayElement(restaurantWorkers);

        // Random timestamp between open and close
        const createdAt = faker.date.between({ from: startTime, to: endTime });

        // Determine if payment should be removed (~removalRate%)
        const timeRemaining = endTime.getTime() - createdAt.getTime();
        const canBeRemoved = timeRemaining > 1000 * 60; // at least 1 minute
        const shouldRemove =
          canBeRemoved && faker.number.float({ min: 0, max: 1 }) < removalRate;

        // For removed payments, ensure removedAt is after createdAt
        const removedAt = shouldRemove
          ? new Date(
              createdAt.getTime() +
                faker.number.int({
                  min: 1000 * 60, // at least 1 minute after
                  max: timeRemaining,
                }),
            )
          : null;

        const payment: WorkshiftPayment = {
          id: uuidv4(),
          categoryId,
          type,
          note: faker.datatype.boolean() ? faker.lorem.sentence() : null,
          amount,
          currency: "EUR", // Use restaurant currency (all EUR in seed)
          workshiftId: workshift.id,
          workerId,
          removedByWorkerId: shouldRemove
            ? faker.helpers.arrayElement(restaurantWorkers)
            : null,
          isRemoved: shouldRemove,
          createdAt,
          removedAt,
        };

        payments.push(payment);
      }
    }
  }

  return payments;
}
