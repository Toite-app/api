type CompareResult = {
  isEqual: boolean;
  changedPaths: string[];
};

export function deepCompare(
  obj1: any,
  obj2: any,
  path: string = "",
): CompareResult {
  // Handle primitive types and null/undefined
  if (obj1 === obj2) return { isEqual: true, changedPaths: [] };
  if (!obj1 || !obj2) return { isEqual: false, changedPaths: [path] };
  if (typeof obj1 !== typeof obj2)
    return { isEqual: false, changedPaths: [path] };

  // Handle Dates
  if (obj1 instanceof Date && obj2 instanceof Date) {
    return {
      isEqual: obj1.getTime() === obj2.getTime(),
      changedPaths: obj1.getTime() === obj2.getTime() ? [] : [path],
    };
  }

  // Handle Arrays
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length)
      return { isEqual: false, changedPaths: [path] };

    const result: CompareResult = { isEqual: true, changedPaths: [] };

    for (let i = 0; i < obj1.length; i++) {
      const comparison = deepCompare(obj1[i], obj2[i], `${path}[${i}]`);
      if (!comparison.isEqual) {
        result.isEqual = false;
        result.changedPaths.push(...comparison.changedPaths);
      }
    }

    return result;
  }

  // Handle Objects
  if (typeof obj1 === "object" && typeof obj2 === "object") {
    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
    const result: CompareResult = { isEqual: true, changedPaths: [] };

    for (const key of Array.from(allKeys)) {
      const newPath = path ? `${path}.${key}` : key;
      const comparison = deepCompare(obj1[key], obj2[key], newPath);

      if (!comparison.isEqual) {
        result.isEqual = false;
        result.changedPaths.push(...comparison.changedPaths);
      }
    }

    return result;
  }

  // Handle other cases (primitives that aren't equal)
  return { isEqual: false, changedPaths: [path] };
}
