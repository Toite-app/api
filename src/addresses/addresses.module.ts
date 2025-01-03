import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";

import { AddressesController } from "./addresses.controller";
import { AddressesService } from "./services/addresses.service";
import { DadataService } from "./services/dadata.service";
import { GoogleService } from "./services/google.service";

@Module({
  imports: [HttpModule],
  controllers: [AddressesController],
  providers: [AddressesService, DadataService, GoogleService],
  exports: [AddressesService],
})
export class AddressesModule {}
