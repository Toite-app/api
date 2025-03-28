export type SeedConfig = {
  restaurants: number;
  restaurantOwners: number;
  workers: number;
  dishMenusPerOwner: number;
  dishesPerMenu: number;
  orders: {
    justCreated: number;
    justCreatedWithDishes: number;
    sentToKitchen: number;
  };
};

export type SeedVariant = "mini" | "huge" | "insane";

export const seedConfigVariants: Record<SeedVariant, SeedConfig> = {
  mini: {
    restaurants: 10,
    restaurantOwners: 2,
    workers: 100,
    dishMenusPerOwner: 1,
    dishesPerMenu: 50,
    orders: {
      justCreated: 100,
      justCreatedWithDishes: 100,
      sentToKitchen: 100,
    },
  },
  huge: {
    restaurants: 100,
    restaurantOwners: 4,
    workers: 4000,
    dishMenusPerOwner: 2,
    dishesPerMenu: 100,
    orders: {
      justCreated: 100_000,
      justCreatedWithDishes: 100_000,
      sentToKitchen: 100_000,
    },
  },
  insane: {
    restaurants: 100,
    restaurantOwners: 4,
    workers: 4000,
    dishMenusPerOwner: 2,
    dishesPerMenu: 100,
    orders: {
      justCreated: 1_000_000,
      justCreatedWithDishes: 1_000_000,
      sentToKitchen: 1_000_000,
    },
  },
};
