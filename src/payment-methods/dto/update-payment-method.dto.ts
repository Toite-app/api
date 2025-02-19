import { IntersectionType, OmitType, PartialType } from "@nestjs/swagger";

import { CreatePaymentMethodDto } from "./create-payment-method.dto";

export class UpdatePaymentMethodDto extends IntersectionType(
  PartialType(
    OmitType(CreatePaymentMethodDto, ["secretKey", "type", "secretId"]),
  ),
) {}
