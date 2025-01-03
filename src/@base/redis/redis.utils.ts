export class RedisUtils {
  public static buildKey(key: string | string[] | Record<string, string>) {
    const appName = "toite-api-instance";
    const version = "1.0.0";
    const env = process.env.NODE_ENV;

    const keyParts = [appName, version, env];

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
