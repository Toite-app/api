import { faker } from "@faker-js/faker";
import { WorkshiftPaymentType } from "src/@base/drizzle/schema/workshift-enums";
import { v4 as uuidv4 } from "uuid";

import {
  CHILD_CATEGORY_SPECIFIERS,
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
