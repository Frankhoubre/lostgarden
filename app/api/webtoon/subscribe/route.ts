import { isLocale, type Locale } from "@/lib/i18n/config";
import { confirmationMail } from "@/lib/webtoon/alerts-mail";
import {
  confirmPageUrl,
  getSubscriber,
  linkOrigin,
  mailConfigured,
  normalizeEmail,
  rateLimited,
  savePending,
  sendMails,
  subscriberId,
} from "@/lib/webtoon/alerts-server";

/**
 * POST /api/webtoon/subscribe { email, locale, consent: true, website: "" }
 *
 * First step of the double opt-in: the address is kept as pending and gets a
 * confirmation link. The answer is the same whether the address was new,
 * pending or already confirmed, so the form tells nobody who subscribed.
 * A confirmed address gets nothing; a pending one gets a new link at most
 * every 10 minutes. `website` is a field hidden from people: filled, it is a bot.
 */

const RESEND_AFTER_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  if (!mailConfigured()) return Response.json({ error: "not_configured" }, { status: 503 });
  const body = (await request.json().catch(() => ({}))) as { email?: unknown; locale?: unknown; consent?: unknown; website?: unknown };
  const email = normalizeEmail(body.email);
  if (!email) return Response.json({ error: "invalid_email" }, { status: 400 });
  if (body.consent !== true) return Response.json({ error: "consent_required" }, { status: 400 });
  const locale: Locale = typeof body.locale === "string" && isLocale(body.locale) ? body.locale : "en";
  if (typeof body.website === "string" && body.website.trim()) return Response.json({ ok: true });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(`ip:${ip}`, 8) || rateLimited(`email:${email}`, 3)) return Response.json({ error: "too_many" }, { status: 429 });

  try {
    const id = subscriberId(email);
    const existing = await getSubscriber(id);
    if (existing?.status === "confirmed") return Response.json({ ok: true });
    if (existing && Date.now() - Date.parse(existing.updated_at) < RESEND_AFTER_MS) return Response.json({ ok: true });
    await savePending(id, email, locale, existing);
    const link = confirmPageUrl(linkOrigin(request), locale, id);
    const result = await sendMails([{ to: email, ...confirmationMail(locale, link) }]);
    if (result.failed) {
      console.error("[webtoon alerts] confirmation not sent", result.errors);
      return Response.json({ error: "send_failed" }, { status: 502 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[webtoon alerts] subscribe failed", error);
    return Response.json({ error: "server" }, { status: 500 });
  }
}
