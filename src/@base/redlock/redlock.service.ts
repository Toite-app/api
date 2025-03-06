import env from "@core/env";
import { Injectable } from "@nestjs/common";
import { Lock, Redlock, Settings } from "@sesamecare-oss/redlock";
import { Redis } from "ioredis";
import { RedisChannels } from "src/@base/redis/channels";

@Injectable()
export class RedlockService {
  private readonly redlock: Redlock;

  constructor() {
    const client = new Redis(`${env.REDIS_URL}/${RedisChannels.REDLOCK}`, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.redlock = new Redlock([client], {
      driftFactor: 0.01,
      retryCount: 10,
      retryDelay: 200,
      retryJitter: 200,
    });
  }

  public async acquire(
    resources: string[],
    duration: number,
    settings?: Partial<Settings>,
  ) {
    return await this.redlock.acquire(resources, duration, settings);
  }

  public async release(lock: Lock, settings?: Partial<Settings>) {
    return await this.redlock.release(lock, settings);
  }
}
