import { SetMetadata } from "@nestjs/common";

/**
 * @description Cache request options
 * @param ttl - Time to live in seconds
 */
export type CacheRequestOptions = {
  ttl?: number;
};

export const CACHE_REQUEST_KEY = "cacheRequest";

export const CacheRequest = (options?: CacheRequestOptions) =>
  SetMetadata(CACHE_REQUEST_KEY, options);
