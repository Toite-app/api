import { faker } from "@faker-js/faker";
import { v4 as uuidv4 } from "uuid";

import { SEED_CONFIG } from "../config";
import { schema } from "../db";

export type Discount = typeof schema.discounts.$inferInsert;
export type DiscountConnection =
  typeof schema.discountsConnections.$inferInsert;

// Days of week for discount scheduling
const ALL_DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
] as const;
const WEEKEND = ["friday", "saturday", "sunday"] as const;

// Order sources
const ALL_ORDER_FROMS = ["app", "website", "internal"] as const;

// Order types
const ALL_ORDER_TYPES = ["hall", "banquet", "takeaway", "delivery"] as const;

// Discount type configurations with matching data
interface DiscountTypeConfig {
  name: string;
  description: string;
  percent: number;
  daysOfWeek: readonly string[];
  orderFroms: readonly string[];
  orderTypes: readonly string[];
  startTime: string | null;
  endTime: string | null;
  activeFromDaysAgo: number; // Days ago to start
  activeToDaysFromNow: number; // Days from now to end
  applyOnlyAtFirstOrder?: boolean;
}

const DISCOUNT_TYPE_CONFIGS: DiscountTypeConfig[] = [
  {
    name: "Happy Hour",
    description: "Special pricing during happy hour",
    percent: 15,
    daysOfWeek: WEEKDAYS,
    orderFroms: ALL_ORDER_FROMS,
    orderTypes: ["hall", "takeaway"],
    startTime: "16:00:00",
    endTime: "19:00:00",
    activeFromDaysAgo: 30,
    activeToDaysFromNow: 90,
  },
  {
    name: "Lunch Special",
    description: "Discounted pricing for lunch hours",
    percent: 20,
    daysOfWeek: WEEKDAYS,
    orderFroms: ALL_ORDER_FROMS,
    orderTypes: ["hall", "takeaway", "delivery"],
    startTime: "11:00:00",
    endTime: "15:00:00",
    activeFromDaysAgo: 60,
    activeToDaysFromNow: 120,
  },
  {
    name: "Weekend Deal",
    description: "Special weekend discount for all menu items",
    percent: 10,
    daysOfWeek: WEEKEND,
    orderFroms: ALL_ORDER_FROMS,
    orderTypes: ALL_ORDER_TYPES,
    startTime: null,
    endTime: null,
    activeFromDaysAgo: 30,
    activeToDaysFromNow: 60,
  },
  {
    name: "Early Bird",
    description: "Early dining discount for orders before evening hours",
    percent: 15,
    daysOfWeek: ALL_DAYS_OF_WEEK,
    orderFroms: ALL_ORDER_FROMS,
    orderTypes: ["hall", "takeaway", "delivery"],
    startTime: "12:00:00",
    endTime: "18:00:00",
    activeFromDaysAgo: 45,
    activeToDaysFromNow: 90,
  },
  {
    name: "Late Night",
    description: "Late night special for orders after 10 PM",
    percent: 20,
    daysOfWeek: ["thursday", "friday", "saturday"],
    orderFroms: ALL_ORDER_FROMS,
    orderTypes: ["takeaway", "delivery"],
    startTime: "22:00:00",
    endTime: null, // Until closing
    activeFromDaysAgo: 15,
    activeToDaysFromNow: 45,
  },
  {
    name: "Student Discount",
    description: "Discount for students with valid ID",
    percent: 10,
    daysOfWeek: ALL_DAYS_OF_WEEK,
    orderFroms: ALL_ORDER_FROMS,
    orderTypes: ALL_ORDER_TYPES,
    startTime: null,
    endTime: null,
    activeFromDaysAgo: 180,
    activeToDaysFromNow: 365,
  },
  {
    name: "Senior Discount",
    description: "Special pricing for seniors 65 and older",
    percent: 15,
    daysOfWeek: ALL_DAYS_OF_WEEK,
    orderFroms: ALL_ORDER_FROMS,
    orderTypes: ALL_ORDER_TYPES,
    startTime: null,
    endTime: null,
    activeFromDaysAgo: 365,
    activeToDaysFromNow: 365,
  },
  {
    name: "Family Deal",
    description: "Group dining discount for parties of 4 or more",
    percent: 12,
    daysOfWeek: WEEKEND,
    orderFroms: ALL_ORDER_FROMS,
    orderTypes: ["hall", "banquet"],
    startTime: null,
    endTime: null,
    activeFromDaysAgo: 30,
    activeToDaysFromNow: 90,
  },
  {
    name: "Loyalty Bonus",
    description: "Special pricing for our regular customers",
    percent: 8,
    daysOfWeek: ALL_DAYS_OF_WEEK,
    orderFroms: ALL_ORDER_FROMS,
    orderTypes: ALL_ORDER_TYPES,
    startTime: null,
    endTime: null,
    activeFromDaysAgo: 90,
    activeToDaysFromNow: 180,
  },
  {
    name: "First Order",
    description: "Welcome discount for your first order with us",
    percent: 15,
    daysOfWeek: ALL_DAYS_OF_WEEK,
    orderFroms: ["app", "website"],
    orderTypes: ALL_ORDER_TYPES,
    startTime: null,
    endTime: null,
    activeFromDaysAgo: 30,
    activeToDaysFromNow: 180,
    applyOnlyAtFirstOrder: true,
  },
  {
    name: "Flash Sale",
    description: "Limited time offer with significant savings",
    percent: 25,
    daysOfWeek: ALL_DAYS_OF_WEEK,
    orderFroms: ALL_ORDER_FROMS,
    orderTypes: ALL_ORDER_TYPES,
    startTime: null,
    endTime: null,
    activeFromDaysAgo: 0,
    activeToDaysFromNow: 3, // Very short duration
  },
  {
    name: "Holiday Special",
    description: "Special discount for holiday celebration",
    percent: 20,
    daysOfWeek: ALL_DAYS_OF_WEEK,
    orderFroms: ALL_ORDER_FROMS,
    orderTypes: ALL_ORDER_TYPES,
    startTime: null,
    endTime: null,
    activeFromDaysAgo: 7,
    activeToDaysFromNow: 14,
  },
  {
    name: "Birthday Treat",
    description: "Special discount for birthday celebrations",
    percent: 10,
    daysOfWeek: ALL_DAYS_OF_WEEK,
    orderFroms: ALL_ORDER_FROMS,
    orderTypes: ["hall", "banquet"],
    startTime: null,
    endTime: null,
    activeFromDaysAgo: 60,
    activeToDaysFromNow: 120,
  },
  {
    name: "Member Exclusive",
    description: "Exclusive discount for our premium members",
    percent: 12,
    daysOfWeek: ALL_DAYS_OF_WEEK,
    orderFroms: ALL_ORDER_FROMS,
    orderTypes: ALL_ORDER_TYPES,
    startTime: null,
    endTime: null,
    activeFromDaysAgo: 90,
    activeToDaysFromNow: 365,
  },
  {
    name: "Delivery Deal",
    description: "Special discount for delivery orders",
    percent: 8,
    daysOfWeek: ALL_DAYS_OF_WEEK,
    orderFroms: ["app", "website"],
    orderTypes: ["delivery"],
    startTime: null,
    endTime: null,
    activeFromDaysAgo: 30,
    activeToDaysFromNow: 90,
  },
];

export interface MockDiscountsOptions {
  restaurantIds: string[];
  menuToRestaurantsMap: Map<string, string[]>; // menuId -> restaurantId[]
  menuCategoriesMap: Map<string, Map<string, string>>; // menuId -> (categoryName -> categoryId)
}

export interface DiscountWithConnections {
  discount: Discount;
  connections: DiscountConnection[];
}

/**
 * Generate discounts for restaurants with their connections
 */
export function mockDiscounts(
  opts: MockDiscountsOptions,
): DiscountWithConnections[] {
  const { restaurantIds, menuToRestaurantsMap, menuCategoriesMap } = opts;

  const result: DiscountWithConnections[] = [];

  // Build reverse map: restaurantId -> menuIds
  const restaurantToMenusMap = new Map<string, string[]>();
  for (const [menuId, restaurants] of menuToRestaurantsMap.entries()) {
    for (const restaurantId of restaurants) {
      const existing = restaurantToMenusMap.get(restaurantId) ?? [];
      restaurantToMenusMap.set(restaurantId, [...existing, menuId]);
    }
  }

  for (const restaurantId of restaurantIds) {
    // Random number of discounts (0 to maxPerRestaurant)
    const discountCount = faker.number.int({
      min: 0,
      max: SEED_CONFIG.discounts.maxPerRestaurant,
    });

    const restaurantMenuIds = restaurantToMenusMap.get(restaurantId) ?? [];

    // Skip if no menus for this restaurant
    if (restaurantMenuIds.length === 0) {
      continue;
    }

    for (let i = 0; i < discountCount; i++) {
      const discountId = uuidv4();

      // Pick a random discount type configuration
      const config = faker.helpers.arrayElement(DISCOUNT_TYPE_CONFIGS);

      // Calculate active dates based on config
      const now = new Date();
      const activeFrom = new Date(now);
      activeFrom.setDate(activeFrom.getDate() - config.activeFromDaysAgo);

      const activeTo = new Date(now);
      activeTo.setDate(activeTo.getDate() + config.activeToDaysFromNow);

      // Create discount record based on config
      const discount: Discount = {
        id: discountId,
        name: config.name,
        description: config.description,
        percent: config.percent,
        orderFroms: [...config.orderFroms] as any,
        orderTypes: [...config.orderTypes] as any,
        daysOfWeek: [...config.daysOfWeek] as any,
        promocode: null,
        applyOnlyByPromocode: false,
        applyOnlyAtFirstOrder: config.applyOnlyAtFirstOrder ?? false,
        isEnabled: true,
        startTime: config.startTime,
        endTime: config.endTime,
        activeFrom,
        activeTo,
        createdAt: faker.date.between({ from: activeFrom, to: now }),
      };

      // Generate connections for this discount
      const connections: DiscountConnection[] = [];

      // Pick 1-3 random menus for this discount
      const selectedMenus = faker.helpers.arrayElements(restaurantMenuIds, {
        min: 1,
        max: Math.min(3, restaurantMenuIds.length),
      });

      for (const menuId of selectedMenus) {
        const categoryMap = menuCategoriesMap.get(menuId);
        if (!categoryMap || categoryMap.size === 0) {
          continue;
        }

        // Get all category IDs for this menu
        const categoryIds = Array.from(categoryMap.values());

        // Pick 1-5 random categories for this discount connection
        const selectedCategories = faker.helpers.arrayElements(categoryIds, {
          min: 1,
          max: Math.min(5, categoryIds.length),
        });

        // Create a connection for each category
        for (const categoryId of selectedCategories) {
          connections.push({
            discountId,
            dishesMenuId: menuId,
            restaurantId,
            dishCategoryId: categoryId,
          });
        }
      }

      // Only add discount if it has connections
      if (connections.length > 0) {
        result.push({ discount, connections });
      }
    }
  }

  return result;
}

// Connection key format for discount lookup
export type DiscountConnectionKey = string;

export interface DiscountInfo {
  id: string;
  percent: number;
}

/**
 * Build a lookup map from (menuId:categoryId:restaurantId) -> best discount
 * When multiple discounts apply to same connection, highest percent wins
 */
export function buildDiscountLookupMap(
  discountsWithConnections: DiscountWithConnections[],
): Map<DiscountConnectionKey, DiscountInfo> {
  const map = new Map<DiscountConnectionKey, DiscountInfo>();

  for (const { discount, connections } of discountsWithConnections) {
    for (const conn of connections) {
      const key = `${conn.dishesMenuId}:${conn.dishCategoryId}:${conn.restaurantId}`;
      const existing = map.get(key);

      // Keep the higher percent discount
      if (!existing || discount.percent! > existing.percent) {
        map.set(key, {
          id: discount.id!,
          percent: discount.percent!,
        });
      }
    }
  }

  return map;
}

/**
 * Get the best discount for a dish in a specific restaurant
 */
export function getDiscountForDish(
  discountMap: Map<DiscountConnectionKey, DiscountInfo>,
  menuId: string,
  categoryIds: string[],
  restaurantId: string,
): DiscountInfo | null {
  let bestDiscount: DiscountInfo | null = null;

  for (const categoryId of categoryIds) {
    const key = `${menuId}:${categoryId}:${restaurantId}`;
    const discount = discountMap.get(key);

    if (
      discount &&
      (!bestDiscount || discount.percent > bestDiscount.percent)
    ) {
      bestDiscount = discount;
    }
  }

  return bestDiscount;
}
