import type { VisionSection } from "@/lib/vision-article";

export type ArticleLink = {
  label: string;
  /** Absolute URL for external links, or a locale-neutral path such as `/process`. */
  href: string;
};

export type RankedAnime = {
  rank: number;
  title: string;
  /** Year, country, studio, format. Rendered as a single dim line. */
  meta: string;
  /** One line that says why the entry sits at this rank. */
  verdict: string;
  paragraphs: readonly string[];
  aiRoleLabel: string;
  aiRole: string;
  links?: readonly ArticleLink[];
  /** Official upload only, verified against the uploading channel. */
  youtubeId?: string;
};

export type AiAnimeArticle = {
  /** Answer-first paragraph, written to be quotable by answer engines. */
  lead: string;
  updatedLabel: string;
  byline: string;
  disclosure: string;
  intro: readonly string[];
  method: {
    heading: string;
    paragraphs: readonly string[];
    list: readonly string[];
  };
  rankingHeading: string;
  entries: readonly RankedAnime[];
  sections: readonly VisionSection[];
  productionHeading: string;
  productionParagraphs: readonly string[];
  productionLinks: readonly ArticleLink[];
  faqHeading: string;
  faq: readonly { question: string; answer: string }[];
  sourcesHeading: string;
  sourcesNote: string;
  sources: readonly ArticleLink[];
  relatedHeading: string;
  relatedLinks: readonly ArticleLink[];
};
