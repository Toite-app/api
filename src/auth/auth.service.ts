import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { WorkersService } from "src/workers/workers.service";
import { SignInDto } from "./dto/sign-in.dto";
import argon2 from "argon2";
import { WorkerEntity } from "src/workers/entities/worker.entity";

@Injectable()
export class AuthService {
  constructor(private workersService: WorkersService) {}

  async validateSignIn(dto: SignInDto): Promise<WorkerEntity> {
    const { login, password } = dto;

    const worker = await this.workersService.findOneByLogin(login);

    if (!worker) {
      throw new NotFoundException("User not found");
    }

    // TODO: Implement logic for timeout in case of wrong password
    if (!(await argon2.verify(worker.passwordHash, password))) {
      throw new ForbiddenException("Wrong password");
    }

    return worker;
  }
}
