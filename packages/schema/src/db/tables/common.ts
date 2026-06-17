import * as z from "zod";

export const IdSchema = z.uuidv7();

export const TimestampSchema = z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/);
