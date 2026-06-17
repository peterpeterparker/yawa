export type Result<T> = { status: "success"; result: T } | { status: "error"; err: unknown };
