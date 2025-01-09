import { PartialType } from "@nestjs/swagger";
import { CreateGuestDto } from "src/guests/dtos/create-guest.dto";

export class UpdateGuestDto extends PartialType(CreateGuestDto) {
  updatedAt?: Date;
}
