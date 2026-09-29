import { locales, type Locale } from "@/lib/i18n/config";
import type { SubscribersSummary } from "@/lib/webtoon/alerts";
import { announcementMail } from "@/lib/webtoon/alerts-mail";
import {
  deleteSubscribers,
  episodeUrl,
  linkOrigin,
  listAnnouncements,
  listSubscribers,
  mailConfigured,
  mailDryRun,
  oneClickUrl,
  saveAnnouncement,
  sendMails,
  sortSubscribers,
  unsubscribePageUrl,
  type OutgoingMail,
} from "@/lib/webtoon/alerts-server";
import { getWebtoonScript } from "@/lib/webtoon/scripts";
import { fetchSeries } from "@/lib/webtoon/series-server";
import { verifyStudioRequest } from "@/lib/webtoon/studio-server";
import { fill, localizedText } from "@/lib/webtoon/text";

/**
 * The studio's side of the episode alerts ("Prévenir les abonnés").
 * GET: how many confirmed subscribers, per language, and the published episodes
 * (expired pending addresses and forged documents are purged on the way).
 * POST { slug, subjects, texts, confirm: true, force? }: sends the announcement
 * of one episode to every confirmed subscriber, in their language, with their
 * own unsubscribe link. Only ever called by hand from the studio, after an
 * explicit confirmation; a second announcement of the same episode needs `force`.
 */

export const maxDuration = 300;

async function studio(request: Request) {
  const identity = await verifyStudioRequest(request);
  if (!identity) return { error: Response.json({ error: "studio access required" }, { status: 401 }) };
  if (!identity.idToken) return { error: Response.json({ error: "Connectez-vous au studio : la liste des abonnés n'est lisible que par le compte." }, { status: 400 }) };
  return { idToken: identity.idToken };
}

async function episodes() {
  const series = await fetchSeries();
  return series.map((e) => {
    const built = getWebtoonScript(e.slug);
    const titles = Object.fromEntries(locales.map((l) => [l, built ? localizedText(built.title, l) : e.title])) as Record<Locale, string>;
    return { slug: e.slug, label: `${e.series} · Épisode ${e.episode}`, titles, published_at: e.published_at };
  });
}

export async function GET(request: Request) {
  const auth = await studio(request);
  if (auth.error) return auth.error;
  try {
    const [list, announced, published] = await Promise.all([listSubscribers(auth.idToken), listAnnouncements(auth.idToken), episodes()]);
    const { confirmed, pending, purge } = sortSubscribers(list);
    // Expired pending addresses and forged documents go whenever the studio looks.
    if (purge.length) await deleteSubscribers(purge, auth.idToken).catch((error: unknown) => console.error("[webtoon alerts] purge failed", error));
    const by_locale: Record<string, number> = {};
    for (const s of confirmed) by_locale[s.locale] = (by_locale[s.locale] ?? 0) + 1;
    const summary: SubscribersSummary = {
      configured: mailConfigured(),
      dry_run: mailDryRun(),
      confirmed: confirmed.length,
      pending: pending.length,
      by_locale,
      episodes: published.map((e) => {
        const a = announced.find((x) => x.slug === e.slug);
        return { ...e, announced_at: a?.sent_at ?? null, announced_count: a?.count ?? null };
      }),
    };
    return Response.json(summary);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

type SendBody = { slug?: string; subjects?: Partial<Record<Locale, string>>; texts?: Partial<Record<Locale, string>>; confirm?: boolean; force?: boolean };

export async function POST(request: Request) {
  const auth = await studio(request);
  if (auth.error) return auth.error;
  if (!mailConfigured()) return Response.json({ error: "Envoi non configuré : RESEND_API_KEY et WEBTOON_MAIL_FROM manquent." }, { status: 503 });
  const body = (await request.json().catch(() => ({}))) as SendBody;
  if (body.confirm !== true) return Response.json({ error: "confirmation explicite requise" }, { status: 400 });
  const episode = (await episodes()).find((e) => e.slug === body.slug);
  if (!episode) return Response.json({ error: "épisode inconnu ou pas encore publié" }, { status: 404 });

  try {
    const [list, announced] = await Promise.all([listSubscribers(auth.idToken), listAnnouncements(auth.idToken)]);
    const { confirmed, purge } = sortSubscribers(list);
    // Forged documents and expired pending addresses go; failure here does not block the send.
    if (purge.length) await deleteSubscribers(purge, auth.idToken).catch((error: unknown) => console.error("[webtoon alerts] purge failed", error));
    const previous = announced.find((a) => a.slug === episode.slug);
    if (previous && !body.force) return Response.json({ error: "already_announced", sent_at: previous.sent_at, count: previous.count }, { status: 409 });
    if (!confirmed.length) return Response.json({ error: "aucun abonné confirmé" }, { status: 400 });

    const origin = linkOrigin(request);
    const mails: OutgoingMail[] = [];
    for (const s of confirmed) {
      const title = episode.titles[s.locale];
      const subject = fill((body.subjects?.[s.locale] ?? "").trim(), { title }).slice(0, 200);
      const text = fill((body.texts?.[s.locale] ?? "").trim(), { title }).slice(0, 2000);
      if (!subject || !text) return Response.json({ error: `objet ou texte manquant en ${s.locale}` }, { status: 400 });
      const oneClick = oneClickUrl(origin, s.id);
      mails.push({
        to: s.email,
        ...announcementMail(s.locale, { subject, text, link: episodeUrl(origin, s.locale, episode.slug), unsubscribeLink: unsubscribePageUrl(origin, s.locale, s.id) }),
        headers: { "List-Unsubscribe": `<${oneClick}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
      });
    }
    const result = await sendMails(mails);
    // A dry run sends nothing, so it does not count as the episode's announcement.
    if (result.sent && !mailDryRun()) await saveAnnouncement({ slug: episode.slug, sent_at: new Date().toISOString(), count: result.sent }, auth.idToken);
    return Response.json({ ...result, purged: purge.length, dry_run: mailDryRun() });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
