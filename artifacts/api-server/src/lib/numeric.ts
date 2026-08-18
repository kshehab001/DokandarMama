/** Drizzle returns `numeric` columns as strings to avoid precision loss. */
export function toNum(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === "number" ? value : parseFloat(value);
}

/** Thrown inside a `db.transaction` callback to abort with a specific HTTP status. */
export class RouteError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "RouteError";
  }
}
