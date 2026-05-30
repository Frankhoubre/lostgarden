"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { KnightCard, type KnightCardContent } from "@/components/knights/KnightCard";
import { useLocale } from "@/components/providers/LocaleProvider";
import { formatMessage } from "@/lib/i18n/format";
import {
  KNIGHTS_CAROUSEL_ORDER,
  isKnightRevealed,
  type KnightNumber,
} from "@/lib/knights";

function getKnightContent(
  number: KnightNumber,
  revealed: Record<string, {
    name: string;
    title: string;
    tagline: string;
    description: string;
    traits: string[];
  }>,
  hidden: {
    hiddenBadge: string;
    hiddenTitle: string;
    hiddenTeaser: string;
  },
): KnightCardContent {
  if (!isKnightRevealed(number)) {
    return {
      revealed: false,
      hiddenBadge: hidden.hiddenBadge,
      hiddenTitle: formatMessage(hidden.hiddenTitle, { number: String(number) }),
      hiddenTeaser: hidden.hiddenTeaser,
    };
  }

  const entry = revealed[String(number)];
  if (!entry) {
    return {
      revealed: false,
      hiddenBadge: hidden.hiddenBadge,
      hiddenTitle: formatMessage(hidden.hiddenTitle, { number: String(number) }),
      hiddenTeaser: hidden.hiddenTeaser,
    };
  }

  return { revealed: true, ...entry };
}

export function KnightsCarousel() {
  const { dict } = useLocale();
  const { knights } = dict;
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateActiveIndex = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const cards = Array.from(track.children) as HTMLElement[];
    if (cards.length === 0) return;

    const trackCenter = track.scrollLeft + track.clientWidth / 2;
    let closest = 0;
    let minDistance = Infinity;

    cards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(cardCenter - trackCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closest = index;
      }
    });

    setActiveIndex(closest);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    updateActiveIndex();
    track.addEventListener("scroll", updateActiveIndex, { passive: true });
    window.addEventListener("resize", updateActiveIndex);

    return () => {
      track.removeEventListener("scroll", updateActiveIndex);
      window.removeEventListener("resize", updateActiveIndex);
    };
  }, [updateActiveIndex]);

  function scrollToIndex(index: number) {
    const track = trackRef.current;
    const card = track?.children[index] as HTMLElement | undefined;
    card?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }

  function goPrev() {
    scrollToIndex(Math.max(0, activeIndex - 1));
  }

  function goNext() {
    scrollToIndex(Math.min(KNIGHTS_CAROUSEL_ORDER.length - 1, activeIndex + 1));
  }

  const activeKnight = KNIGHTS_CAROUSEL_ORDER[activeIndex];

  return (
    <div className="knights-carousel">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          className="knights-carousel-control"
          onClick={goPrev}
          disabled={activeIndex === 0}
          aria-label={knights.prev}
        >
          <span aria-hidden="true">‹</span>
        </button>

        <p className="anime-label text-center font-display text-xs tracking-[0.2em] text-cyan-pale/80 sm:text-sm">
          {formatMessage(knights.counter, { number: String(activeKnight) })}
        </p>

        <button
          type="button"
          className="knights-carousel-control"
          onClick={goNext}
          disabled={activeIndex === KNIGHTS_CAROUSEL_ORDER.length - 1}
          aria-label={knights.next}
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>

      <div
        ref={trackRef}
        className="knights-carousel-track mt-6"
        role="region"
        aria-roledescription="carousel"
        aria-label={knights.carouselAria}
      >
        {KNIGHTS_CAROUSEL_ORDER.map((number) => {
          const content = getKnightContent(number, knights.revealed, {
            hiddenBadge: knights.hiddenBadge,
            hiddenTitle: knights.hiddenTitle,
            hiddenTeaser: knights.hiddenTeaser,
          });

          return (
            <div key={number} className="knights-carousel-slide">
              <KnightCard
                number={number}
                content={content}
                traitsAria={
                  content.revealed
                    ? formatMessage(knights.traitsAria, { name: content.name })
                    : undefined
                }
              />
            </div>
          );
        })}
      </div>

      <div
        className="mt-6 flex flex-wrap justify-center gap-2"
        role="tablist"
        aria-label={knights.dotsAria}
      >
        {KNIGHTS_CAROUSEL_ORDER.map((number, index) => (
          <button
            key={number}
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            aria-label={formatMessage(knights.dotLabel, { number: String(number) })}
            className={`knights-carousel-dot ${index === activeIndex ? "is-active" : ""}`}
            onClick={() => scrollToIndex(index)}
          />
        ))}
      </div>
    </div>
  );
}
