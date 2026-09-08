import Image from "next/image";
import type { ArticleImage } from "@/lib/article-media";

type ArticleHeroProps = {
  image: ArticleImage;
  alt: string;
};

/** Lead still of an article: first thing under the title, above the byline. */
export function ArticleHero({ image, alt }: ArticleHeroProps) {
  return (
    <figure className="trailer-frame overflow-hidden rounded-2xl">
      <Image
        src={image.src}
        alt={alt}
        width={image.width}
        height={image.height}
        priority
        sizes="(max-width: 768px) 100vw, 768px"
        className="h-auto w-full"
      />
    </figure>
  );
}
