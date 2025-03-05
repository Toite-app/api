import { PartialType } from "@nestjs/swagger";
import { CreateDishDto } from "src/dishes/@/dtos/create-dish.dto";

export class UpdateDishMenuDto extends PartialType(CreateDishDto) {}
