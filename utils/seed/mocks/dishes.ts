import { faker } from "@faker-js/faker";
import { v4 as uuidv4 } from "uuid";

import {
  CuisineType,
  DishData,
  getDishesForCuisine,
  getMenuCategoriesForCuisine,
} from "../data/cuisines";
import { DISH_NOTES } from "../data/kitchen-terms";
import { schema } from "../db";

export type Dish = typeof schema.dishes.$inferInsert;
export type DishMenu = typeof schema.dishesMenus.$inferInsert;
export type DishToRestaurant = typeof schema.dishesToRestaurants.$inferInsert;
export type DishToWorkshop = typeof schema.dishesToWorkshops.$inferInsert;
export type DishMenuToRestaurant =
  typeof schema.dishesMenusToRestaurants.$inferInsert;

// Extended menu type with cuisine info for downstream use
export interface DishMenuWithCuisine extends DishMenu {
  cuisineType: CuisineType;
}

export interface MockDishMenusOptions {
  ownerIds: string[];
  count: number;
  ownerCuisineMap: Map<string, CuisineType[]>; // owner -> cuisines of their restaurants
}

export function mockDishMenus(
  opts: MockDishMenusOptions,
): DishMenuWithCuisine[] {
  const { ownerIds, count, ownerCuisineMap } = opts;

  return ownerIds.flatMap((ownerId) => {
    // Get cuisines for this owner's restaurants
    const ownerCuisines = ownerCuisineMap.get(ownerId) ?? ["general"];
    // Unique cuisines
    const uniqueCuisines = [...new Set(ownerCuisines)];

    return Array.from({ length: count }, (_, index) => {
      // Assign cuisine based on owner's restaurants
      const cuisineType =
        uniqueCuisines[index % uniqueCuisines.length] ?? "general";
      const menuCategories = getMenuCategoriesForCuisine(cuisineType);

      // Pick a realistic menu category name
      const menuName = faker.helpers.arrayElement(menuCategories);

      return {
        id: uuidv4(),
        name: menuName,
        ownerId,
        cuisineType,
      };
    });
  });
}

export interface MockDishesOptions {
  menuId: string;
  count: number;
  cuisineType: CuisineType;
}

export function mockDishes(opts: MockDishesOptions): Dish[] {
  const { menuId, count, cuisineType } = opts;

  // Get dishes for this cuisine
  const availableDishes = getDishesForCuisine(cuisineType);

  // Select random dishes, ensuring no duplicates within the same menu
  const selectedDishes = faker.helpers.arrayElements(availableDishes, {
    min: Math.min(count, availableDishes.length),
    max: Math.min(count, availableDishes.length),
  });

  // If we need more dishes than available, we'll repeat some with variations
  const dishesToCreate: DishData[] = [...selectedDishes];
  while (dishesToCreate.length < count) {
    const baseDish = faker.helpers.arrayElement(availableDishes);
    dishesToCreate.push(baseDish);
  }

  return dishesToCreate.map((dishData) => ({
    id: uuidv4(),
    name: dishData.name,
    amountPerItem: faker.number.int({ min: 1, max: 4 }),
    cookingTimeInMin: faker.number.int({
      min: dishData.cookingTimeMin,
      max: dishData.cookingTimeMax,
    }),
    printLabelEveryItem: faker.number.int({ min: 1, max: 3 }),
    isPublishedAtSite: true,
    isPublishedInApp: true,
    isLabelPrintingEnabled: faker.datatype.boolean(),
    weight: faker.number.int({
      min: dishData.weightMin,
      max: dishData.weightMax,
    }),
    weightMeasure: "grams" as const,
    note: faker.helpers.maybe(() => faker.helpers.arrayElement(DISH_NOTES), {
      probability: 0.3, // 30% chance of having a note
    }),
    menuId,
  }));
}

export interface MockDishPricesOptions {
  dishes: Array<{ id: string; menuId: string | null }>;
  menuToRestaurantsMap: Map<string, string[]>; // menuId -> restaurantId[]
  currency: string;
}

export function mockDishPrices(
  opts: MockDishPricesOptions,
): DishToRestaurant[] {
  const { dishes, menuToRestaurantsMap, currency } = opts;

  return dishes.flatMap((dish) => {
    if (!dish.menuId) return [];

    const restaurantIds = menuToRestaurantsMap.get(dish.menuId) ?? [];
    const price = faker.number.float({ min: 3, max: 22 }).toFixed(2);

    return restaurantIds.map((restaurantId) => ({
      dishId: dish.id,
      restaurantId,
      price,
      currency: currency as "EUR",
      isInStopList: false,
    }));
  });
}

export interface MockDishWorkshopsOptions {
  dishPrices: DishToRestaurant[];
  restaurantWorkshopsMap: Map<string, string[]>; // restaurantId -> workshopId[]
}

export function mockDishWorkshops(
  opts: MockDishWorkshopsOptions,
): DishToWorkshop[] {
  const { dishPrices, restaurantWorkshopsMap } = opts;

  return dishPrices.flatMap((dishPrice) => {
    const workshopIds =
      restaurantWorkshopsMap.get(dishPrice.restaurantId) ?? [];

    if (workshopIds.length === 0) return [];

    // Assign dish to 1-3 random workshops
    const selectedWorkshops = faker.helpers.arrayElements(workshopIds, {
      min: 1,
      max: Math.min(3, workshopIds.length),
    });

    return selectedWorkshops.map((workshopId) => ({
      dishId: dishPrice.dishId,
      workshopId,
    }));
  });
}

export interface MockMenuToRestaurantsOptions {
  menus: DishMenuWithCuisine[];
  ownerToRestaurantsMap: Map<string, string[]>; // ownerId -> restaurantId[]
}

export function mockMenuToRestaurants(
  opts: MockMenuToRestaurantsOptions,
): DishMenuToRestaurant[] {
  const { menus, ownerToRestaurantsMap } = opts;

  return menus.flatMap((menu) => {
    const restaurantIds = ownerToRestaurantsMap.get(menu.ownerId) ?? [];

    return restaurantIds.map((restaurantId) => ({
      dishesMenuId: menu.id!,
      restaurantId,
    }));
  });
}
