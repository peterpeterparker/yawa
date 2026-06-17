import { z } from "zod";

export const NotEmptyStringSchema = z.string().trim().min(1, { message: "Required" });

export const notEmptyString = (value: string | undefined | null): value is string => {
  const { success } = NotEmptyStringSchema.safeParse(value);
  return success;
};

export const isEmptyString = (value: string | undefined | null): value is undefined | null | "" =>
  !notEmptyString(value);

export const sanitizeEmptyString = (value: string | undefined | null): string | undefined => {
  return notEmptyString(value?.trim()) ? value.trim() : undefined;
};

export const assertNotEmptyString: (
  value: string | undefined | null,
  name: string,
) => asserts value is z.infer<typeof NotEmptyStringSchema> = (
  value: string | undefined | null,
  name: string,
): void => {
  const { success } = NotEmptyStringSchema.safeParse(value);

  if (!success) {
    throw new Error(`Missing or empty required field ${name}`);
  }
};
