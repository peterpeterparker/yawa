import { hash } from "../../utils/hash";

interface TokenHashKeyPair {
  token: string;
  hash: string;
}

export const generateToken = async (): Promise<TokenHashKeyPair> => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const token = bytes.toBase64({ alphabet: "base64url" });
  return { token, ...hashToken({ token }) };
};

export const hashToken = ({
  token: input,
}: Pick<TokenHashKeyPair, "token">): Pick<TokenHashKeyPair, "hash"> => hash({ input });
