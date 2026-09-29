import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WebtoonPageShell } from "@/components/webtoon/WebtoonPageShell";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localePath } from "@/lib/i18n/navigation";
import { buildPageMetadata } from "@/lib/seo";
import { ALERTS_PAGE, CONFIRM_PATH, UNSUBSCRIBE_PATH } from "@/lib/webtoon/alerts";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) return {};
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);
  return buildPageMetadata({
    locale,
    title: `${dict.webtoon.alerts.pageTitle} | Lost Garden`,
    description: dict.webtoon.alerts.lead,
    path: localePath(locale, ALERTS_PAGE),
    absoluteTitle: true,
    noIndex: true,
  });
}

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

/**
 * Where the links of the alert emails land. Nothing happens on opening the
 * link (mail scanners open them too): the reader presses the button, the
 * form posts to the confirm or unsubscribe route, which comes back here
 * with `?done=<outcome>`.
 */
export default async function EpisodeAlertsPage({ params, searchParams }: PageProps) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const query = await searchParams;
  const w = (await getDictionary(locale)).webtoon.alerts;
  const action = one(query.action);
  const done = one(query.done);
  const messages: Record<string, string> = {
    confirmed: w.doneConfirmed,
    unsubscribed: w.doneUnsubscribed,
    expired: w.doneExpired,
    invalid: w.doneInvalid,
    error: w.doneError,
  };

  let body;
  if (done) {
    body = <p className="mt-4 text-base text-ivory/90" role="status">{messages[done] ?? w.doneInvalid}</p>;
  } else if (action === "confirm" || action === "unsubscribe") {
    const confirm = action === "confirm";
    body = (
      <form method="post" action={confirm ? CONFIRM_PATH : UNSUBSCRIBE_PATH} className="mt-4 grid gap-4">
        <p className="text-base text-ivory/90">{confirm ? w.confirmLead : w.unsubscribeLead}</p>
        <input type="hidden" name="id" value={one(query.id)} />
        <input type="hidden" name="sig" value={one(query.sig)} />
        <input type="hidden" name="locale" value={locale} />
        {confirm ? <input type="hidden" name="ts" value={one(query.ts)} /> : null}
        <div className="webtoon-alerts-row">
          <button type="submit">{confirm ? w.confirmButton : w.unsubscribeButton}</button>
        </div>
      </form>
    );
  } else {
    body = <p className="mt-4 text-base text-ivory/90">{w.doneInvalid}</p>;
  }

  return (
    <WebtoonPageShell>
      <section className="webtoon-alerts">
        <h1 className="anime-heading font-display text-2xl text-lily">{w.pageTitle}</h1>
        {body}
        <p className="mt-6 text-sm">
          <Link href={localePath(locale, "/webtoon")} className="text-cyan-pale/90 underline-offset-4 hover:text-magic hover:underline">
            {w.back}
          </Link>
        </p>
      </section>
    </WebtoonPageShell>
  );
}
