import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IGuest } from "@postgress-db/schema/guests";
import { Expose } from "class-transformer";
import { IsISO8601, IsNumber, IsString, IsUUID } from "class-validator";

export class GuestEntity implements IGuest {
  @Expose()
  @IsUUID()
  @ApiProperty({
    description: "Unique identifier of the guest",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  id: string;

  @Expose()
  @IsString()
  @ApiProperty({
    description: "Name of the guest",
    example: "John Doe",
  })
  name: string;

  @Expose()
  @IsString()
  @ApiProperty({
    description: "Phone number of the guest",
    example: "+1234567890",
  })
  phone: string;

  @Expose()
  @IsString()
  @ApiProperty({
    description: "Email address of the guest",
    example: "john.doe@example.com",
    nullable: true,
  })
  @ApiPropertyOptional()
  email: string | null;

  @Expose()
  @IsNumber()
  @ApiProperty({
    description: "Guest's bonus balance",
    example: 100,
  })
  bonusBalance: number;

  @Expose()
  @IsISO8601()
  @ApiProperty({
    description: "Date of guest's last visit",
    example: new Date(),
    type: Date,
  })
  lastVisitAt: Date;

  @Expose()
  @IsISO8601()
  @ApiProperty({
    description: "Date when guest was created",
    example: new Date("2021-08-01T00:00:00.000Z"),
    type: Date,
  })
  createdAt: Date;

  @Expose()
  @IsISO8601()
  @ApiProperty({
    description: "Date when guest was last updated",
    example: new Date("2022-03-01T05:20:52.000Z"),
    type: Date,
  })
  updatedAt: Date;
}
