import { AnimatedInView } from "./AnimatedInView";

export function TrailerSection() {
  return (
    <section id="trailer" className="section-pad">
      <AnimatedInView>
        <div className="mx-auto max-w-5xl">
          {/*
            Replace this block with an iframe when ready:
            <iframe src="https://player.vimeo.com/video/..." ... />
          */}
          <div className="trailer-frame relative aspect-video w-full overflow-hidden rounded-2xl">
            <div className="trailer-frame-inner absolute inset-0 flex flex-col items-center justify-center gap-4">
              <button
                type="button"
                className="trailer-play"
                aria-label="Trailer coming soon"
                disabled
              >
                <span className="trailer-play-icon" aria-hidden="true" />
              </button>
              <p className="font-display text-2xl tracking-[0.14em] text-lily sm:text-3xl">
                Trailer coming soon
              </p>
              <p className="font-body text-sm text-ivory/50 sm:text-base">
                The first episode is currently in production.
              </p>
            </div>
          </div>
        </div>
      </AnimatedInView>
    </section>
  );
}
