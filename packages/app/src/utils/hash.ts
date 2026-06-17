import { CryptoHasher } from "bun";

export const hash = ({ input }: { input: string }): { hash: string } => ({
  hash: new CryptoHasher("sha256").update(input).digest("hex"),
});
