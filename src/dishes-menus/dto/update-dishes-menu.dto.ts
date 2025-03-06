import { PartialType } from "@nestjs/swagger";
import { CreateDishesMenuDto } from "src/dishes-menus/dto/create-dishes-menu.dto";

export class UpdateDishesMenuDto extends PartialType(CreateDishesMenuDto) {}
