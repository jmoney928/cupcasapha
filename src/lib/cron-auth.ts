import "server-only";
import { timingSafeEqual } from "node:crypto";
import { serverEnv } from "@/lib/env";

/** Cron routes accept `Authorization: Bearer <CRON_SECRET>` (pg_cron via pg_net, or Vercel Cron). */
export function authorizeCron(request: Request): boolean {
  const header = request.headers.get("authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  const secret = serverEnv().CRON_SECRET;
  if (!token || token.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(secret));
}
