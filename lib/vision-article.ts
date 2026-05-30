export type VisionSection = {
  heading?: string;
  paragraphs?: readonly string[];
  list?: readonly string[];
  trailingParagraphs?: readonly string[];
  callouts?: readonly string[];
};

export type VisionArticle = {
  byline: string;
  sections: readonly VisionSection[];
};
