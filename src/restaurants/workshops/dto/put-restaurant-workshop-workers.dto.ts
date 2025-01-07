import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { IsArray, IsUUID } from "class-validator";

export class UpdateRestaurantWorkshopWorkersDto {
  @Expose()
  @IsArray()
  @IsUUID(4, { each: true })
  @ApiProperty({
    description: "Array of worker IDs to assign to the workshop",
    example: ["d290f1ee-6c54-4b01-90e6-d701748f0851"],
    type: [String],
  })
  workerIds: string[];
}
