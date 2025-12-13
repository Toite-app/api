export const SEED_CONFIG = {
  restaurants: 20,
  restaurantOwners: 2,
  workers: 100,
  dishMenusPerOwner: 2,
  dishesPerMenu: 20,
  workshopsPerRestaurant: 5,
  dishModifiersPerRestaurant: 10,
  orders: {
    justCreated: 1_000,
    justCreatedWithDishes: 1_000,
    sentToKitchen: 1_000,
  },
} as const;

export type SeedConfig = typeof SEED_CONFIG;
