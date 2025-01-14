import env from "@core/env";

export class RedisUtils {
  public static buildKey(key: string | string[] | Record<string, string>) {
    const appName = "toite-api-instance";
    const version = "1.0.0";

    const keyParts = [appName, version, env.NODE_ENV];

    if (typeof key === "string") {
      keyParts.push(key);
    } else if (Array.isArray(key)) {
      keyParts.push(...key);
    } else if (typeof key === "object") {
      keyParts.push(JSON.stringify(key));
    }

    return keyParts.join(":");
  }
}
