import type { Metadata } from "next";
import { LegalPageShell, LegalSection } from "@/components/legal/LegalPageShell";
import { LEGAL_HOSTS, LEGAL_PUBLISHER } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Legal Notice — Lost Garden",
  description: "Legal notice for the Lost Garden website.",
};

export default function LegalNoticePage() {
  const fullAddress = `${LEGAL_PUBLISHER.address}, ${LEGAL_PUBLISHER.postalCode} ${LEGAL_PUBLISHER.city}, ${LEGAL_PUBLISHER.country}`;

  return (
    <LegalPageShell title="Legal Notice">
      <LegalSection title="Site publisher">
        <p>
          The website <strong>{LEGAL_PUBLISHER.project}</strong> is published by{" "}
          <strong>{LEGAL_PUBLISHER.name}</strong>, located at {fullAddress}.
        </p>
        <p>
          Contact:{" "}
          <a
            href={`mailto:${LEGAL_PUBLISHER.email}`}
            className="text-magic underline-offset-2 hover:underline"
          >
            {LEGAL_PUBLISHER.email}
          </a>
        </p>
        <p>Publication director: {LEGAL_PUBLISHER.name}.</p>
      </LegalSection>

      <LegalSection title="Hosting">
        <p>
          The site and its services are hosted and delivered through the following
          providers:
        </p>
        <ul className="list-disc space-y-4 pl-5">
          {LEGAL_HOSTS.map((host) => (
            <li key={host.name}>
              <strong>{host.name}</strong> — {host.role}
              <br />
              {host.address}
              <br />
              <a
                href={host.website}
                className="text-magic underline-offset-2 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {host.website}
              </a>
            </li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection title="Intellectual property">
        <p>
          All site content (text, visuals, illustrations, logo, visual identity,
          videos) is the exclusive property of {LEGAL_PUBLISHER.name}, unless
          otherwise stated. Any unauthorized reproduction, representation, or use
          is prohibited.
        </p>
      </LegalSection>

      <LegalSection title="Liability">
        <p>
          {LEGAL_PUBLISHER.name} strives to keep the information on this site
          accurate but cannot be held liable for errors, omissions, or temporary
          unavailability of the service.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
