export const ORDERS_QUEUE = "orders";

export enum OrderQueueJobName {
  UPDATE = "crud-update",
  DISH_UPDATE = "dish-update",
  NEW_ORDER = "new-order",
  NEW_ORDER_AT_KITCHEN = "new-order-at-kitchen",
}
