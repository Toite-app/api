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
  workshifts: {
    historyDays: 7, // how many days of workshift history to generate
    paymentsPerWorkshiftPerType: {
      min: 3,
      max: 10,
    },
    paymentRemovalRate: 0.05,
  },
  orders: {
    justCreated: 1_000,
    justCreatedWithDishes: 1_000,
    sentToKitchen: 1_000,
  },
  discounts: {
    maxPerRestaurant: 5, // 0 to 5 discounts per restaurant
    minPercent: 5, // minimum discount percent
    maxPercent: 30, // maximum discount percent
    applyToOrdersRate: 0.5, // 50% of orders with dishes get discounts applied
  },
} as const;

export type SeedConfig = typeof SEED_CONFIG;
