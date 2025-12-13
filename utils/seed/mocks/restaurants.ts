import { faker } from "@faker-js/faker";
import { v4 as uuidv4 } from "uuid";

import {
  ALL_CUISINES,
  CUISINES,
  CuisineType,
  SPECIFIC_CUISINES,
} from "../data/cuisines";
import { DISH_MODIFIERS, WORKSHOP_NAMES } from "../data/kitchen-terms";
import { schema } from "../db";

export type Restaurant = typeof schema.restaurants.$inferInsert;
export type RestaurantHours = typeof schema.restaurantHours.$inferInsert;
export type RestaurantWorkshop = typeof schema.restaurantWorkshops.$inferInsert;
export type PaymentMethod = typeof schema.paymentMethods.$inferInsert;
export type DishModifier = typeof schema.dishModifiers.$inferInsert;

// Extended restaurant type with cuisine for downstream use
export interface RestaurantWithCuisine extends Restaurant {
  cuisineType: CuisineType;
}

export interface MockRestaurantsOptions {
  count: number;
  ownerIds: string[];
}

// Generate a realistic restaurant name based on cuisine
function generateRestaurantName(cuisineType: CuisineType): string {
  const cuisine = CUISINES[cuisineType];
  const prefix = faker.helpers.arrayElement(cuisine.restaurantPrefixes);
  const suffix = faker.helpers.arrayElement(cuisine.restaurantSuffixes);

  // Add variety with different name patterns
  const pattern = faker.number.int({ min: 1, max: 4 });

  switch (pattern) {
    case 1:
      return `${prefix} ${suffix}`;
    case 2:
      // Name-based (e.g., "Marco's Trattoria", "Chen's Kitchen")
      return `${faker.person.lastName()}'s ${suffix}`;
    case 3:
      // Location-based (e.g., "Downtown Grill", "Harbor Kitchen")
      return `${faker.helpers.arrayElement([
        "Downtown",
        "Harbor",
        "Riverside",
        "Hillside",
        "Garden",
        "Sunset",
        "Ocean View",
        "Lakeside",
      ])} ${suffix}`;
    default:
      return `${prefix} ${suffix}`;
  }
}

export function mockRestaurants(
  opts: MockRestaurantsOptions,
): RestaurantWithCuisine[] {
  const { count, ownerIds } = opts;

  // Distribute cuisines: mostly specific cuisines, some general
  const cuisineDistribution: CuisineType[] = [];
  const generalCount = Math.floor(count * 0.15); // ~15% general restaurants
  const specificCount = count - generalCount;

  // Add specific cuisine restaurants (distributed evenly)
  for (let i = 0; i < specificCount; i++) {
    cuisineDistribution.push(SPECIFIC_CUISINES[i % SPECIFIC_CUISINES.length]);
  }

  // Add general restaurants
  for (let i = 0; i < generalCount; i++) {
    cuisineDistribution.push("general");
  }

  // Shuffle the distribution
  faker.helpers.shuffle(cuisineDistribution);

  return Array.from({ length: count }, (_, index) => {
    const cuisineType =
      cuisineDistribution[index] ?? faker.helpers.arrayElement(ALL_CUISINES);

    return {
      id: uuidv4(),
      name: generateRestaurantName(cuisineType),
      legalEntity: `${faker.company.name()}, ${faker.string.numeric(8)}`,
      address: faker.location.streetAddress(),
      latitude: faker.location.latitude().toString(),
      longitude: faker.location.longitude().toString(),
      currency: "EUR" as const,
      timezone: "Europe/Tallinn",
      isEnabled: true,
      isClosedForever: false,
      ownerId: faker.helpers.arrayElement(ownerIds),
      cuisineType,
    };
  });
}

const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export function mockRestaurantHours(
  restaurantIds: string[],
): RestaurantHours[] {
  return restaurantIds.flatMap((restaurantId) =>
    DAYS_OF_WEEK.map((dayOfWeek) => ({
      id: uuidv4(),
      restaurantId,
      dayOfWeek,
      openingTime: "10:00",
      closingTime: "23:00",
      isEnabled: true,
    })),
  );
}

export interface MockWorkshopsOptions {
  restaurantId: string;
  count: number;
}

export function mockRestaurantWorkshops(
  opts: MockWorkshopsOptions,
): RestaurantWorkshop[] {
  const { restaurantId, count } = opts;

  // Select random workshops from the realistic list
  const selectedWorkshops = faker.helpers.arrayElements(WORKSHOP_NAMES, {
    min: count,
    max: count,
  });

  return selectedWorkshops.map((name) => ({
    id: uuidv4(),
    restaurantId,
    name,
    isEnabled: true,
    isLabelPrintingEnabled: faker.datatype.boolean(),
  }));
}

const PAYMENT_METHOD_NAMES = ["Cash", "Card", "Online transfer"];

export function mockPaymentMethods(restaurantIds: string[]): PaymentMethod[] {
  return restaurantIds.flatMap((restaurantId) =>
    PAYMENT_METHOD_NAMES.map((name) => ({
      id: uuidv4(),
      restaurantId,
      icon: "CARD" as const,
      name,
      type: "CUSTOM" as const,
      isActive: true,
    })),
  );
}

export interface MockDishModifiersOptions {
  restaurantId: string;
  count: number;
}

export function mockDishModifiers(
  opts: MockDishModifiersOptions,
): DishModifier[] {
  const { restaurantId, count } = opts;

  // Select random modifiers from the realistic list
  const selectedModifiers = faker.helpers.arrayElements(DISH_MODIFIERS, {
    min: count,
    max: count,
  });

  return selectedModifiers.map((name) => ({
    id: uuidv4(),
    restaurantId,
    name,
    isActive: true,
  }));
}
