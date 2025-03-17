import { PartialType, PickType } from "@nestjs/swagger";
import { WorkshiftPaymentCategoryEntity } from "src/restaurants/workshift-payment-categories/entity/workshift-payment-category.entity";

export class UpdateWorkshiftPaymentCategoryDto extends PartialType(
  PickType(WorkshiftPaymentCategoryEntity, ["name", "description", "isActive"]),
) {}
