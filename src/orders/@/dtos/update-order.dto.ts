import { PartialType } from "@nestjs/swagger";
import { CreateOrderDto } from "src/orders/@/dtos/create-order.dto";

export class UpdateOrderDto extends PartialType(CreateOrderDto) {}
