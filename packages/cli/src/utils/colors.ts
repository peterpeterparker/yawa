const colorize =
  (color: string) =>
  (text: string): string => {
    const ansi = Bun.color(color, "ansi");
    const reset = "\x1b[0m";
    return `${ansi}${text}${reset}`;
  };

export const lime = colorize("lime");
export const cyan = colorize("cyan");
export const grey = colorize("grey");
export const red = colorize("red");
export const magenta = colorize("magenta");
export const yellow = colorize("yellow");
