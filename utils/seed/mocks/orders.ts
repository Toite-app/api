import { faker } from "@faker-js/faker";
import { v4 as uuidv4 } from "uuid";

import { ORDER_NOTES } from "../data/kitchen-terms";
import { schema } from "../db";

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

export interface MockJustCreatedOrdersOptions {
  count: number;
  restaurants: RestaurantWithPaymentMethods[];
}

export function mockJustCreatedOrders(
  opts: MockJustCreatedOrdersOptions,
): Order[] {
  const { count, restaurants } = opts;

  return Array.from({ length: count }, () => {
    const restaurant = faker.helpers.arrayElement(restaurants);
    orderNumber++;

    const type = faker.helpers.arrayElement([
      "hall",
      "banquet",
      "takeaway",
      "delivery",
    ] as OrderType[]);

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
      guestName: faker.person.firstName(),
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
}

export interface OrderWithDishes extends Order {
  orderDishes: OrderDish[];
  modifierAssignments: DishModifierToOrderDish[];
}

export function mockOrdersWithDishes(
  opts: MockOrdersWithDishesOptions,
): OrderWithDishes[] {
  const { count, restaurants, restaurantDishesMap, restaurantModifiersMap } =
    opts;

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

      orderDishes.push({
        id: orderDishId,
        orderId,
        dishId: dish.id,
        name: dish.name,
        status: "pending" as const,
        quantity,
        price: dish.price,
        finalPrice: dish.price,
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
      guestName: faker.person.firstName(),
      note: generateOrderNote(),
      paymentMethodId: faker.helpers.arrayElement(restaurant.paymentMethodIds),
      guestsAmount: faker.number.int({ min: 1, max: 10 }),
      subtotal: subtotal.toFixed(2),
      total: subtotal.toFixed(2),
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
