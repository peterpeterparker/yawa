import { isEmptyString, notEmptyString } from "yawa-common";
import ipaddr from "ipaddr.js";
import { type Ip, Ipv4Schema, Ipv6Schema, type OptionIp } from "../types/ip";

// Source: https://github.com/umami-software/umami/blob/master/src/lib/ip.ts
const IP_ADDRESS_HEADERS = [
  "true-client-ip", // CDN
  "cf-connecting-ip", // Cloudflare
  "fastly-client-ip", // Fastly
  "x-nf-client-connection-ip", // Netlify
  "do-connecting-ip", // Digital Ocean
  "x-real-ip", // Reverse proxy
  "x-appengine-user-ip", // Google App Engine
  "x-forwarded-for", // Caddy https://caddyserver.com/docs/caddyfile/directives/reverse_proxy#defaults
  "forwarded",
  "x-client-ip",
  "x-cluster-client-ip",
  "x-forwarded",
];

export const getIp = ({ headers }: { headers: Headers }): OptionIp => {
  const header = IP_ADDRESS_HEADERS.find((name) => headers.get(name));

  if (isEmptyString(header)) {
    return undefined;
  }

  const ip = headers.get(header);

  if (isEmptyString(ip)) {
    return undefined;
  }

  if (header === "x-forwarded-for") {
    const firstValue = ip.split(",")?.[0]?.trim();
    return notEmptyString(firstValue) ? normalizeIp({ ip: firstValue }) : undefined;
  }

  if (header === "forwarded") {
    const match = ip.match(/for=\[?([0-9a-fA-F:.]+)\]?/);
    return notEmptyString(match?.[1]) ? normalizeIp({ ip: match[1] }) : undefined;
  }

  return normalizeIp({ ip });
};

const normalizeIp = ({ ip }: { ip: string }): Ip | undefined => {
  if (Ipv6Schema.safeParse(ip).success) {
    const parseIp = (): Ip => {
      try {
        const parsed = ipaddr.parse(ip);

        if (parsed.kind() === "ipv6" && (parsed as ipaddr.IPv6).isIPv4MappedAddress()) {
          return (parsed as ipaddr.IPv6).toIPv4Address().toString();
        }

        return parsed.toString();
      } catch {
        // If parsing fails, analytics might result in different session ID but nothing that bad
        // therefore we silence the error
        return ip;
      }
    };

    return parseIp();
  }

  if (Ipv4Schema.safeParse(ip).success) {
    return ip;
  }

  const IPV4_WITH_PORT = /^(\d{1,3}\.){3}\d{1,3}:\d+$/;
  if (IPV4_WITH_PORT.test(ip)) {
    const stripped = ip.replace(/:\d+$/, "");
    return Ipv4Schema.safeParse(stripped).success ? stripped : undefined;
  }

  return undefined;
};
