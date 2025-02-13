export const ORDERS_QUEUE = "orders";

export enum OrderQueueJobName {
  CRUD_UPDATE = "crud-update",
  DISH_CRUD_UPDATE = "dish-crud-update",
  RECALCULATE_PRICES = "recalculate-prices",
}
