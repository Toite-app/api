import { IntersectionType, PickType } from "@nestjs/swagger";
import { GuestEntity } from "src/guests/entities/guest.entity";

export class FindOrCreateGuestDto extends IntersectionType(
  PickType(GuestEntity, ["phone"]),
) {}
