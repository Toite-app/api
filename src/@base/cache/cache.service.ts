import { env } from "process";

import { Injectable, Logger } from "@nestjs/common";
import { Redis } from "ioredis";
import { RedisChannels } from "src/@base/redis/channels";

type CacheData = {
  type: string;
  data: any;
};

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  private redis: Redis;

  /**
   * Get a Redis client
   * @returns Redis client
   */
  private _getRedis() {
    const client = new Redis(`${env.REDIS_URL}/${RedisChannels.CACHE}`, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    client.on("error", (error) => {
      this.logger.error("Redis client error:", error);
    });

    return client;
  }

  onModuleInit() {
    this.redis = this._getRedis();
  }

  public async get(key: string): Promise<string | object | null> {
    const data = await this.redis.get(key);
    if (!data) {
      return null;
    }

    const parsedData = JSON.parse(String(data)) as CacheData;

    if (parsedData.type === "string") {
      return parsedData.data;
    }

    if (parsedData.type === "object") {
      return JSON.stringify(parsedData.data);
    }

    return null;
  }

  public async setex(
    key: string,
    value: string | object,
    ttl: number,
  ): Promise<void> {
    await this.redis.setex(
      key,
      ttl,
      JSON.stringify({
        type: typeof value,
        data: value,
      } satisfies CacheData),
    );
  }
}
