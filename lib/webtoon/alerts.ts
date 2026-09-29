/**
 * EPISODE ALERTS: readers leave their address to hear about the next episode.
 * Double opt-in: the address waits as `pending` until its owner clicks the
 * confirmation link, and only `confirmed` subscribers receive an announcement,
 * sent by hand from the studio (never on publication).
 *
 * Store: `webtoon_subscribers/<id>`, where id = HMAC(server secret, address).
 * The server has no admin credentials, so the Firestore rules let anyone who
 * knows an id read it, confirm it or delete it; nobody but the studio can
 * list the collection, and only the server can compute an id from an address,
 * so the id works as the capability carried by the links of the emails. A
 * document forged straight through Firestore gets an id that does not match
 * its address: the studio ignores it and removes it when it sends.
 */
export const SUBSCRIBERS_COLLECTION = "webtoon_subscribers";
/** One record per announced episode (`<slug>`): when, to how many. Studio only. */
export const ANNOUNCEMENTS_COLLECTION = "webtoon_announcements";

export type SubscriberStatus = "pending" | "confirmed";

/** A confirmation link stays valid this long; an unconfirmed address is purged after it. */
export const CONFIRM_TTL_MS = 7 * 24 * 3600 * 1000;

export const SUBSCRIBE_PATH = "/api/webtoon/subscribe";
export const CONFIRM_PATH = "/api/webtoon/subscribe/confirm";
export const UNSUBSCRIBE_PATH = "/api/webtoon/subscribe/unsubscribe";
/** The page the links of the emails open (a button, so that mail scanners do not act on a GET). */
export const ALERTS_PAGE = "/webtoon/alerts";

export type AlertsResult = "confirmed" | "unsubscribed" | "expired" | "invalid" | "error";

/** What the studio sees and sends (route /api/webtoon/subscribers). */
export type SubscribersSummary = {
  configured: boolean;
  dry_run: boolean;
  confirmed: number;
  pending: number;
  by_locale: Record<string, number>;
  episodes: { slug: string; label: string; titles: Record<string, string>; published_at: string; announced_at: string | null; announced_count: number | null }[];
};
