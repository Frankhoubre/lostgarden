type FaqItem = { question: string; answer: string };

type ProcessFaqProps = {
  heading: string;
  items: ReadonlyArray<FaqItem>;
};

export function ProcessFaq({ heading, items }: ProcessFaqProps) {
  return (
    <section className="mt-12">
      <h2 className="anime-heading font-display text-xl text-lily sm:text-2xl">
        {heading}
      </h2>
      <dl className="mt-6 space-y-8">
        {items.map((item) => (
          <div key={item.question}>
            <dt className="font-display text-base font-semibold text-cyan-pale/95 sm:text-lg">
              {item.question}
            </dt>
            <dd className="mt-2 text-ivory/80">{item.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
