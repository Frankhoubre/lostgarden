type TimelineStep = {
  title: string;
  line: string;
};

type EpisodeTimelineProps = {
  steps: TimelineStep[];
};

export function EpisodeTimeline({ steps }: EpisodeTimelineProps) {
  return (
    <ol className="episode-timeline mx-auto mt-12 max-w-3xl">
      {steps.map((step, index) => (
        <li key={step.title} className="episode-timeline-step group">
          <span className="episode-timeline-marker" aria-hidden="true" />
          <div className="episode-timeline-content">
            <span className="font-display text-xs tracking-[0.2em] text-glow/45">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-1 font-display text-lg tracking-[0.1em] text-lily transition-colors group-hover:text-magic sm:text-xl">
              {step.title}
            </h3>
            <p className="mt-2 font-body text-sm italic leading-relaxed text-sol-ivory/55">
              {step.line}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
