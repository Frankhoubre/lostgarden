import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { VisionArticle } from "@/components/vision/VisionArticle";
import { JsonLd } from "@/components/seo/JsonLd";
import { VISION_ARTICLE } from "@/lib/vision-article";
import { breadcrumbJsonLd, buildPageMetadata, webPageJsonLd } from "@/lib/seo";

const TITLE = "Vision | Lost Garden";
const DESCRIPTION = VISION_ARTICLE.description;

export const metadata: Metadata = buildPageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/vision",
  absoluteTitle: true,
  ogType: "article",
});

const breadcrumbs = [
  { name: "Home", path: "/" },
  { name: "Vision", path: "/vision" },
] as const;

export default function VisionPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      <JsonLd
        data={webPageJsonLd({
          name: VISION_ARTICLE.headline,
          description: DESCRIPTION,
          path: "/vision",
        })}
      />
      <LegalPageShell title={VISION_ARTICLE.headline}>
        <VisionArticle />
      </LegalPageShell>
    </>
  );
}
