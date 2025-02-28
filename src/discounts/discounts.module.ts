import { Module } from "@nestjs/common";
import { DrizzleModule } from "@postgress-db/drizzle.module";
import { DiscountsController } from "src/discounts/discounts.controller";
import { DiscountsService } from "src/discounts/services/discounts.service";
import { OrderDiscountsService } from "src/discounts/services/order-discounts.service";

@Module({
  imports: [DrizzleModule],
  controllers: [DiscountsController],
  providers: [DiscountsService, OrderDiscountsService],
  exports: [DiscountsService, OrderDiscountsService],
})
export class DiscountsModule {}
