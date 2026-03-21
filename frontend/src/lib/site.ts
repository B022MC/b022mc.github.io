export const SITE_URL =
  process.env.SITE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://b022mc.cn";

export const SITE_NAME = "b022mc's Blog";
export const SITE_DESCRIPTION = "记录关于技术、编程、架构、开源与云原生的思考。";

export function buildSiteUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}
