import { IntersectionType, PartialType, PickType } from "@nestjs/swagger";
import { WorkshiftPaymentEntity } from "src/workshifts/payments/entity/workshift-payment.entity";

export class CreateWorkshiftPaymentDto extends IntersectionType(
  PickType(WorkshiftPaymentEntity, ["categoryId", "amount", "currency"]),
  PartialType(PickType(WorkshiftPaymentEntity, ["note"])),
) {}
