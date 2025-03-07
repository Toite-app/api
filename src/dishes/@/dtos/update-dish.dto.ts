import { OmitType, PartialType } from "@nestjs/swagger";

import { CreateDishDto } from "./create-dish.dto";

export class UpdateDishDto extends PartialType(
  OmitType(CreateDishDto, ["menuId"]),
) {
  updatedAt?: Date;
}
