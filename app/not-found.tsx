import Image from "next/image";
import Link from "next/link";
import { getLocaleFromHeaders } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localePath } from "@/lib/i18n/navigation";

export default async function NotFound() {
  const locale = await getLocaleFromHeaders();
  const dict = await getDictionary(locale);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-24 text-center">
      <Link
        href={localePath(locale, "/")}
        className="hero-logo-wrap hero-logo-float block w-[min(70vw,16rem)]"
      >
        <Image
          src="/images/logo-lost-garden.png"
          alt={dict.common.logoAlt}
          width={1024}
          height={576}
          priority
          unoptimized
          className="hero-logo-img"
          sizes="(max-width: 768px) 70vw, 16rem"
        />
      </Link>

      <p className="anime-label mt-10 font-display text-sm tracking-[0.2em] text-magic">
        404
      </p>
      <h1 className="anime-heading mt-3 font-display text-[clamp(1.75rem,4vw+1rem,3rem)] text-lily">
        {dict.notFound.title}
      </h1>
      <p className="mx-auto mt-4 max-w-md font-body text-base leading-relaxed text-ivory/85">
        {dict.notFound.body}
      </p>

      <Link
        href={localePath(locale, "/")}
        className="btn-primary btn-shimmer mt-10"
      >
        {dict.notFound.cta}
      </Link>
    </main>
  );
}
