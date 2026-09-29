import { isLocale, type Locale } from "@/lib/i18n/config";
import { localePath } from "@/lib/i18n/navigation";
import { ALERTS_PAGE, type AlertsResult } from "@/lib/webtoon/alerts";
import { checkConfirm, getSubscriber, markConfirmed, subscriberId } from "@/lib/webtoon/alerts-server";

/**
 * POST /api/webtoon/subscribe/confirm (form: id, ts, sig, locale)
 *
 * Second step of the double opt-in, from the button of the page the email
 * links to. The signature proves the link came from this server, the id
 * (HMAC of the address) is the document; the answer is a redirect to the
 * page with the outcome.
 */

function back(request: Request, locale: Locale, done: AlertsResult) {
  return Response.redirect(new URL(`${localePath(locale, ALERTS_PAGE)}?done=${done}`, request.url), 303);
}

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const field = (name: string) => String(form?.get(name) ?? "");
  const localeParam = field("locale");
  const locale: Locale = isLocale(localeParam) ? localeParam : "en";
  const id = field("id");
  const check = checkConfirm(id, Number(field("ts")), field("sig"));
  if (check !== "ok") return back(request, locale, check);
  try {
    const subscriber = await getSubscriber(id);
    // Gone (unsubscribed, purged) or not made by this server.
    if (!subscriber || subscriber.id !== subscriberId(subscriber.email)) return back(request, locale, "invalid");
    if (subscriber.status !== "confirmed") await markConfirmed(subscriber);
    return back(request, subscriber.locale, "confirmed");
  } catch (error) {
    console.error("[webtoon alerts] confirm failed", error);
    return back(request, locale, "error");
  }
}
