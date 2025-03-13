import { PickType } from "@nestjs/swagger";
import { WorkshiftEntity } from "src/workshifts/entity/workshift.entity";

export class CreateWorkshiftDto extends PickType(WorkshiftEntity, [
  "restaurantId",
]) {}
