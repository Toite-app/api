import { faker } from "@faker-js/faker";
import { v4 as uuidv4 } from "uuid";

import { SEED_CONFIG } from "../config";
import { ORDER_NOTES } from "../data/kitchen-terms";
import { schema } from "../db";

import {
  DiscountConnectionKey,
  DiscountInfo,
  getDiscountForDish,
} from "./discounts";
import { GuestInfo } from "./guests";

export type Order = typeof schema.orders.$inferInsert;
export type OrderDish = typeof schema.orderDishes.$inferInsert;
export type OrderHistoryRecord = typeof schema.orderHistoryRecords.$inferInsert;
export type DishModifierToOrderDish =
  typeof schema.dishModifiersToOrderDishes.$inferInsert;
export type OrderStatus = Order["status"];
export type OrderType = Order["type"];
export type OrderFrom = Order["from"];

// Restaurant with payment methods for order creation
export interface RestaurantWithPaymentMethods {
  id: string;
  currency: string;
  paymentMethodIds: string[];
}

// Dish with price for order dish creation
export interface DishWithPrice {
  id: string;
  name: string;
  price: string;
  restaurantId: string;
  menuId: string;
  categoryIds: string[];
}

let orderNumber = 0;

function resetOrderNumber(): void {
  orderNumber = 0;
}

// Generate realistic order note (or null)
function generateOrderNote(): string | null {
  if (faker.number.float({ min: 0, max: 1 }) > 0.5) {
    return null;
  }
  return faker.helpers.arrayElement(ORDER_NOTES);
}

// Generate modifier assignments for an order dish
function generateModifierAssignments(
  orderDishId: string,
  restaurantModifiers: string[],
): DishModifierToOrderDish[] {
  // ~40% of order dishes get modifiers
  if (
    restaurantModifiers.length === 0 ||
    faker.number.float({ min: 0, max: 1 }) > 0.4
  ) {
    return [];
  }

  // Assign 1-2 random modifiers
  const modifierCount = faker.number.int({
    min: 1,
    max: Math.min(2, restaurantModifiers.length),
  });

  const selectedModifiers = faker.helpers.arrayElements(
    restaurantModifiers,
    modifierCount,
  );

  return selectedModifiers.map((dishModifierId) => ({
    dishModifierId,
    orderDishId,
  }));
}

// Generate guest info for an order (~50% get a guest assigned)
function generateGuestForOrder(guests: GuestInfo[]): {
  guestId: string | null;
  guestName: string;
  guestPhone: string | null;
} {
  // ~50% of orders have a guest assigned
  if (guests.length === 0 || faker.number.float({ min: 0, max: 1 }) > 0.5) {
    return {
      guestId: null,
      guestName: faker.person.firstName(),
      guestPhone: null,
    };
  }

  const guest = faker.helpers.arrayElement(guests);
  return {
    guestId: guest.id,
    guestName: guest.name,
    guestPhone: guest.phone,
  };
}

export interface MockJustCreatedOrdersOptions {
  count: number;
  restaurants: RestaurantWithPaymentMethods[];
  guests: GuestInfo[];
}

export function mockJustCreatedOrders(
  opts: MockJustCreatedOrdersOptions,
): Order[] {
  const { count, restaurants, guests } = opts;

  return Array.from({ length: count }, () => {
    const restaurant = faker.helpers.arrayElement(restaurants);
    orderNumber++;

    const type = faker.helpers.arrayElement([
      "hall",
      "banquet",
      "takeaway",
      "delivery",
    ] as OrderType[]);

    const { guestId, guestName, guestPhone } = generateGuestForOrder(guests);

    return {
      id: uuidv4(),
      number: orderNumber.toString(),
      restaurantId: restaurant.id,
      currency: restaurant.currency as "EUR",
      from: faker.helpers.arrayElement([
        "app",
        "internal",
        "website",
      ] as OrderFrom[]),
      status: "pending" as OrderStatus,
      type,
      guestId,
      guestName,
      guestPhone,
      note: generateOrderNote(),
      paymentMethodId: faker.helpers.arrayElement(restaurant.paymentMethodIds),
      guestsAmount: faker.number.int({ min: 1, max: 10 }),
      ...((type === "banquet" || type === "hall") && {
        tableNumber: faker.number.int({ min: 1, max: 100 }).toString(),
      }),
      createdAt: faker.date.recent(),
    };
  });
}

export interface MockOrdersWithDishesOptions {
  count: number;
  restaurants: RestaurantWithPaymentMethods[];
  restaurantDishesMap: Map<string, DishWithPrice[]>; // restaurantId -> dishes
  restaurantModifiersMap: Map<string, string[]>; // restaurantId -> modifierIds
  guests: GuestInfo[];
  discountMap?: Map<DiscountConnectionKey, DiscountInfo>; // discount lookup map
}

export interface OrderWithDishes extends Order {
  orderDishes: OrderDish[];
  modifierAssignments: DishModifierToOrderDish[];
}

export function mockOrdersWithDishes(
  opts: MockOrdersWithDishesOptions,
): OrderWithDishes[] {
  const {
    count,
    restaurants,
    restaurantDishesMap,
    restaurantModifiersMap,
    guests,
    discountMap,
  } = opts;

  return Array.from({ length: count }, () => {
    const restaurant = faker.helpers.arrayElement(restaurants);
    orderNumber++;

    const type = faker.helpers.arrayElement([
      "hall",
      "banquet",
      "takeaway",
      "delivery",
    ] as OrderType[]);

    const orderId = uuidv4();
    const availableDishes = restaurantDishesMap.get(restaurant.id) ?? [];
    const restaurantModifiers = restaurantModifiersMap.get(restaurant.id) ?? [];

    // Determine if this order should have discounts applied
    const shouldApplyDiscounts =
      discountMap &&
      discountMap.size > 0 &&
      faker.number.float({ min: 0, max: 1 }) <
        SEED_CONFIG.discounts.applyToOrdersRate;

    // Select 3-11 random dishes for the order
    const selectedDishes = faker.helpers.arrayElements(availableDishes, {
      min: 3,
      max: Math.min(11, availableDishes.length),
    });

    const orderDishes: OrderDish[] = [];
    const modifierAssignments: DishModifierToOrderDish[] = [];

    for (const dish of selectedDishes) {
      const orderDishId = uuidv4();
      const quantity = faker.number.int({ min: 1, max: 10 });
      const price = Number(dish.price);

      // Calculate discount if applicable
      let discountId: string | null = null;
      let discountPercent = 0;
      let discountAmount = 0;
      let finalPrice = price;

      if (shouldApplyDiscounts && discountMap) {
        const discount = getDiscountForDish(
          discountMap,
          dish.menuId,
          dish.categoryIds,
          restaurant.id,
        );

        if (discount) {
          discountId = discount.id;
          discountPercent = discount.percent;
          discountAmount = (price * discountPercent) / 100;
          finalPrice = price - discountAmount;
        }
      }

      orderDishes.push({
        id: orderDishId,
        orderId,
        dishId: dish.id,
        name: dish.name,
        status: "pending" as const,
        quantity,
        price: price.toFixed(2),
        discountId,
        discountPercent: discountPercent.toFixed(2),
        discountAmount: discountAmount.toFixed(2),
        finalPrice: finalPrice.toFixed(2),
      });

      // Generate modifier assignments for this order dish
      const dishModifiers = generateModifierAssignments(
        orderDishId,
        restaurantModifiers,
      );
      modifierAssignments.push(...dishModifiers);
    }

    // Calculate totals
    const subtotal = orderDishes.reduce(
      (sum, od) => sum + Number(od.price) * od.quantity,
      0,
    );

    const totalDiscountAmount = orderDishes.reduce(
      (sum, od) => sum + Number(od.discountAmount) * od.quantity,
      0,
    );

    const total = orderDishes.reduce(
      (sum, od) => sum + Number(od.finalPrice) * od.quantity,
      0,
    );

    const { guestId, guestName, guestPhone } = generateGuestForOrder(guests);

    const order: Order = {
      id: orderId,
      number: orderNumber.toString(),
      restaurantId: restaurant.id,
      currency: restaurant.currency as "EUR",
      from: faker.helpers.arrayElement([
        "app",
        "internal",
        "website",
      ] as OrderFrom[]),
      status: "pending" as OrderStatus,
      type,
      guestId,
      guestName,
      guestPhone,
      note: generateOrderNote(),
      paymentMethodId: faker.helpers.arrayElement(restaurant.paymentMethodIds),
      guestsAmount: faker.number.int({ min: 1, max: 10 }),
      subtotal: subtotal.toFixed(2),
      discountAmount: totalDiscountAmount.toFixed(2),
      total: total.toFixed(2),
      applyDiscounts: shouldApplyDiscounts ?? false,
      ...((type === "banquet" || type === "hall") && {
        tableNumber: faker.number.int({ min: 1, max: 100 }).toString(),
      }),
      createdAt: faker.date.recent(),
    };

    return { ...order, orderDishes, modifierAssignments };
  });
}

export function mockSentToKitchenOrders(
  opts: MockOrdersWithDishesOptions,
): OrderWithDishes[] {
  const ordersWithDishes = mockOrdersWithDishes(opts);

  return ordersWithDishes.map((order) => {
    const cookingAt = faker.date.recent({ refDate: order.createdAt });

    return {
      ...order,
      status: "cooking" as OrderStatus,
      cookingAt,
      orderDishes: order.orderDishes.map((dish) => ({
        ...dish,
        status: "cooking" as const,
        cookingAt,
      })),
    };
  });
}

export function mockOrderHistoryRecords(
  orders: Order[],
  type: "created" | "sent_to_kitchen",
): OrderHistoryRecord[] {
  return orders.map((order) => ({
    orderId: order.id!,
    type,
  }));
}

// Export for resetting between test runs if needed
export { resetOrderNumber };
