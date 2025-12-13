const PREFIX = "[seed]";

export function log(message: string): void {
  console.log(`${PREFIX} ${message}`);
}

export function logError(message: string): void {
  console.error(`${PREFIX} ERROR: ${message}`);
}

export function chunker<T>(arr: T[], chunkSize: number): T[][] {
  return arr.reduce((acc, item, index) => {
    const chunkIndex = Math.floor(index / chunkSize);

    if (!acc[chunkIndex]) {
      acc[chunkIndex] = [];
    }

    acc[chunkIndex].push(item);

    return acc;
  }, [] as T[][]);
}

export async function withTiming<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const duration = ((performance.now() - start) / 1000).toFixed(2);
  log(`${label} (${duration}s)`);
  return result;
}
