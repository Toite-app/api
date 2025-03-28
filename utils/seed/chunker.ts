export default function chunker<T>(arr: T[], chunkSize: number) {
  return arr.reduce((acc, item, index) => {
    const chunkIndex = Math.floor(index / chunkSize);

    if (!acc[chunkIndex]) {
      acc[chunkIndex] = [];
    }

    acc[chunkIndex].push(item);

    return acc;
  }, [] as T[][]);
}
