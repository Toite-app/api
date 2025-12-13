export const SEED_CONFIG = {
  restaurants: 20,
  restaurantOwners: 2,
  workers: 100,
  guests: 2000,
  dishMenusPerOwner: 2,
  dishesPerMenu: 20,
  categoriesPerMenu: 10, // max categories per menu (capped by cuisine's available categories)
  workshopsPerRestaurant: 5,
  dishModifiersPerRestaurant: 10,
  workshiftPaymentCategories: {
    perTypeMin: 2, // minimum categories per type (INCOME/EXPENSE/CASHLESS)
    perTypeMax: 5, // maximum categories per type
    maxChildrenPerParent: 3, // max child categories for a parent
  },
  orders: {
    justCreated: 1_000,
    justCreatedWithDishes: 1_000,
    sentToKitchen: 1_000,
  },
} as const;

export type SeedConfig = typeof SEED_CONFIG;
