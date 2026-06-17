import * as z from "zod";
import type { Option } from "yawa-common";

export const Ipv4Schema = z.ipv4();
export const Ipv6Schema = z.ipv6();

type Ipv6 = z.infer<typeof Ipv6Schema>;
type Ipv4 = z.infer<typeof Ipv4Schema>;

export type Ip = Ipv4 | Ipv6;
export type OptionIp = Option<Ip>;
