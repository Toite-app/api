export type SeedConfig = {
  restaurants: number;
  restaurantOwners: number;
  workers: number;
  dishMenusPerOwner: number;
  dishesPerMenu: number;
  orders: {
    justCreated: number;
    justCreatedWithDishes: number;
  };
};

export type SeedVariant = "mini" | "huge";

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
    },
  },
  huge: {
    restaurants: 100,
    restaurantOwners: 4,
    workers: 4000,
    dishMenusPerOwner: 2,
    dishesPerMenu: 100,
    orders: {
      justCreated: 10_000,
      justCreatedWithDishes: 10_000,
    },
  },
};
