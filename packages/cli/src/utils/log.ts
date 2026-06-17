export const log = (...args: unknown[]) => console.log(...args);

export const error = (...args: unknown[]) => {
  const red = Bun.color("red", "ansi");
  const reset = "\x1b[0m";

  console.error(red, ...args, reset);
};
