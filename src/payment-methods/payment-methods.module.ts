import { Module } from "@nestjs/common";
import { DrizzleModule } from "@postgress-db/drizzle.module";
import { EncryptionModule } from "src/@base/encryption/encryption.module";
import { PaymentMethodsController } from "src/payment-methods/payment-methods.controller";
import { PaymentMethodsService } from "src/payment-methods/payment-methods.service";

@Module({
  imports: [DrizzleModule, EncryptionModule],
  controllers: [PaymentMethodsController],
  providers: [PaymentMethodsService],
  exports: [PaymentMethodsService],
})
export class PaymentMethodsModule {}
