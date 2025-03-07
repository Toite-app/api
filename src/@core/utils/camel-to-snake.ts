export default function camelToSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^_/, "");
}
