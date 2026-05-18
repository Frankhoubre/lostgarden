type SectionTitleProps = {
  children: React.ReactNode;
  subtitle?: string;
  as?: "h2" | "h3";
  className?: string;
};

export function SectionTitle({
  children,
  subtitle,
  as: Tag = "h2",
  className = "",
}: SectionTitleProps) {
  return (
    <header className={`text-center ${className}`}>
      <Tag className="anime-heading font-display text-3xl text-lily sm:text-4xl md:text-5xl">
        {children}
      </Tag>
      {subtitle ? (
        <p className="mx-auto mt-4 max-w-xl font-body text-base font-medium leading-relaxed text-ivory/90 sm:text-lg">
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}
