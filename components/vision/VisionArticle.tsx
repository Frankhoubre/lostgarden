import type { VisionSection } from "@/lib/vision-article";
import { VISION_ARTICLE } from "@/lib/vision-article";

function VisionBlock({ section }: { section: VisionSection }) {
  const bodyClass = section.heading ? "mt-3 space-y-3" : "space-y-3";

  return (
    <section>
      {section.heading ? (
        <h2 className="anime-heading font-display text-xl text-lily sm:text-2xl">
          {section.heading}
        </h2>
      ) : null}
      <div className={bodyClass}>
        {section.paragraphs?.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        {section.list ? (
          <ul className="list-disc space-y-2 pl-5 text-ivory/80">
            {section.list.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
        {section.trailingParagraphs?.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        {section.callouts ? (
          <div className="space-y-2 border-l-2 border-glow/40 py-1 pl-5">
            {section.callouts.map((line) => (
              <p
                key={line}
                className="font-display text-base font-medium text-cyan-pale/95 sm:text-lg"
              >
                {line}
              </p>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function VisionArticle() {
  return (
    <>
      <p className="font-display text-lg text-cyan-pale/90 sm:text-xl">
        Lost Garden
      </p>
      <p className="mt-2 text-ivory/60">
        By Frank Houbre — vision, process, and why AI is a bridge, not a
        shortcut.
      </p>
      {VISION_ARTICLE.sections.map((section, index) => (
        <VisionBlock key={section.heading ?? `intro-${index}`} section={section} />
      ))}
    </>
  );
}
