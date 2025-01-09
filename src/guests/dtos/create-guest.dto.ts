import { IntersectionType, PartialType, PickType } from "@nestjs/swagger";
import { GuestEntity } from "src/guests/entities/guest.entity";

export class CreateGuestDto extends IntersectionType(
  PickType(GuestEntity, ["name", "phone"]),
  PartialType(PickType(GuestEntity, ["email", "bonusBalance"])),
) {}
