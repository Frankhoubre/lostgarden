import { isLocale, type Locale } from "@/lib/i18n/config";
import { localePath } from "@/lib/i18n/navigation";
import { ALERTS_PAGE, type AlertsResult } from "@/lib/webtoon/alerts";
import { checkUnsubscribe, deleteSubscribers } from "@/lib/webtoon/alerts-server";

/**
 * POST /api/webtoon/subscribe/unsubscribe
 *
 * Two callers:
 * - the button of the page the email links to (form: id, sig, locale), answered by a redirect;
 * - the mail client's one-click unsubscribe (RFC 8058: id and sig in the query,
 *   body `List-Unsubscribe=One-Click`), answered by a plain 200.
 * Either way the address is deleted, not kept as "unsubscribed".
 */

export async function POST(request: Request) {
  const url = new URL(request.url);
  const form = await request.formData().catch(() => null);
  const field = (name: string) => String(form?.get(name) ?? url.searchParams.get(name) ?? "");
  const oneClick = form?.get("List-Unsubscribe") === "One-Click";
  const localeParam = field("locale");
  const locale: Locale = isLocale(localeParam) ? localeParam : "en";
  const id = field("id");

  let done: AlertsResult = "unsubscribed";
  if (!checkUnsubscribe(id, field("sig"))) done = "invalid";
  else {
    try {
      await deleteSubscribers([id]);
    } catch (error) {
      console.error("[webtoon alerts] unsubscribe failed", error);
      done = "error";
    }
  }
  if (oneClick) return new Response(done === "unsubscribed" ? "ok" : done, { status: done === "unsubscribed" ? 200 : done === "invalid" ? 400 : 500 });
  return Response.redirect(new URL(`${localePath(locale, ALERTS_PAGE)}?done=${done}`, request.url), 303);
}
