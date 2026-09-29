import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { localePath } from "@/lib/i18n/navigation";
import type { SeriesEpisode } from "@/lib/webtoon/series";

const WORDS: Record<Locale, { previous: string; next: string; all: string; episode: string }> = {
  fr: { previous: "Épisode précédent", next: "Épisode suivant", all: "Tous les épisodes", episode: "Épisode" },
  en: { previous: "Previous episode", next: "Next episode", all: "All episodes", episode: "Episode" },
  ja: { previous: "前の話", next: "次の話", all: "すべての話", episode: "第" },
  ko: { previous: "이전 화", next: "다음 화", all: "전체 회차", episode: "제" },
};

/** The end of an episode: the one before, the one after, the whole series. */
export function EpisodeNav({ locale, previous, next }: { locale: Locale; previous?: SeriesEpisode; next?: SeriesEpisode }) {
  const w = WORDS[locale] ?? WORDS.en;
  return (
    <nav className="webtoon-episode-nav" aria-label={w.all}>
      {previous ? (
        <Link href={localePath(locale, `/webtoon/${previous.slug}`)} className="webtoon-episode-link">
          <small>← {w.previous}</small>
          <b>{previous.title}</b>
        </Link>
      ) : (
        <span />
      )}
      <Link href={localePath(locale, "/webtoon")} className="webtoon-episode-all">
        {w.all}
      </Link>
      {next ? (
        <Link href={localePath(locale, `/webtoon/${next.slug}`)} className="webtoon-episode-link is-next">
          <small>{w.next} →</small>
          <b>{next.title}</b>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
