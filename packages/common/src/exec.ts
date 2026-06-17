import type { Result } from "./types";

export const tryCatch = async <T>(fn: () => Promise<T>): Promise<Result<T>> => {
  try {
    const result = await fn();
    return { status: "success", result };
  } catch (err: unknown) {
    return { status: "error", err };
  }
};

export const safeExec = async <T>(fn: () => Promise<Result<T>>): Promise<Result<T>> => {
  try {
    return await fn();
  } catch (err: unknown) {
    return { status: "error", err };
  }
};
