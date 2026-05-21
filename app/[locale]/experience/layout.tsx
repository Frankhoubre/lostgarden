import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localePath } from "@/lib/i18n/navigation";
import { buildPageMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";

type ExperienceLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: ExperienceLayoutProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) return {};
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);

  return buildPageMetadata({
    locale,
    title: dict.meta.experience.title,
    description: dict.meta.experience.description,
    path: localePath(locale, "/experience"),
    noIndex: true,
  });
}

export default function ExperienceLayout({ children }: ExperienceLayoutProps) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  );
}
