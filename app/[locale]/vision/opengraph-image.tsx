import { articleShareImage } from "@/lib/article-share";

export const alt = "Lost Garden";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 86400;

export default function Image({ params }: { params: Promise<{ locale: string }> }) {
  return articleShareImage(params, "/vision");
}
