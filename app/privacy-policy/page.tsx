import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell, LegalSection } from "@/components/legal/LegalPageShell";
import { LEGAL_HOSTS, LEGAL_PUBLISHER } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy — Lost Garden",
  description: "Privacy policy and cookie information for the Lost Garden website.",
};

export default function PrivacyPolicyPage() {
  const fullAddress = `${LEGAL_PUBLISHER.address}, ${LEGAL_PUBLISHER.postalCode} ${LEGAL_PUBLISHER.city}, ${LEGAL_PUBLISHER.country}`;

  return (
    <LegalPageShell title="Privacy Policy">
      <p className="text-ivory/70">
        Last updated:{" "}
        {new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      <LegalSection title="Data controller">
        <p>
          <strong>{LEGAL_PUBLISHER.name}</strong>
          <br />
          {fullAddress}
          <br />
          <a
            href={`mailto:${LEGAL_PUBLISHER.email}`}
            className="text-magic underline-offset-2 hover:underline"
          >
            {LEGAL_PUBLISHER.email}
          </a>
        </p>
      </LegalSection>

      <LegalSection title="Data we collect">
        <p>Depending on how you use the site, we may process:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Account data: email address, display name (via Firebase Authentication,
            including Google sign-in).
          </li>
          <li>
            Profile data synced in Firestore (user ID, email, name, creation and
            update timestamps).
          </li>
          <li>
            Technical data: server logs, IP address, browser type (Vercel /
            Firebase hosts).
          </li>
          <li>
            Cookie preference: your choice stored locally in your browser.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Purposes and legal bases">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Providing the signed-in experience and managing accounts (performance
            of the service).
          </li>
          <li>
            Security, maintenance, and improvement of the site (legitimate
            interest).
          </li>
          <li>Compliance with applicable legal obligations.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Retention">
        <p>
          Account data is kept while your account is active, then deleted or
          anonymized within a reasonable period after account deletion, unless a
          longer retention period is required by law.
        </p>
      </LegalSection>

      <LegalSection title="Recipients and processors">
        <p>Your data may be processed by:</p>
        <ul className="list-disc space-y-3 pl-5">
          {LEGAL_HOSTS.map((host) => (
            <li key={host.name}>
              <strong>{host.name}</strong> — {host.role}
            </li>
          ))}
        </ul>
        <p>
          Some providers may be located outside the European Union. Where
          applicable, appropriate safeguards (such as standard contractual clauses)
          are put in place by those providers.
        </p>
      </LegalSection>

      <LegalSection title="Cookies and local storage">
        <p>The site uses in particular:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Technical cookies / storage</strong>: required for
            authentication and core functionality (Firebase).
          </li>
          <li>
            <strong>localStorage</strong>: stores your cookie banner choice.
          </li>
        </ul>
        <p>
          You can manage cookies in your browser settings. Refusing certain cookies
          may limit access to the signed-in experience.
        </p>
      </LegalSection>

      <LegalSection title="Your rights (GDPR)">
        <p>
          Under the General Data Protection Regulation, you have the right to
          access, rectify, erase, restrict, object to, and port your personal data.
        </p>
        <p>
          To exercise your rights, contact:{" "}
          <a
            href={`mailto:${LEGAL_PUBLISHER.email}`}
            className="text-magic underline-offset-2 hover:underline"
          >
            {LEGAL_PUBLISHER.email}
          </a>
          . You may also lodge a complaint with the CNIL (
          <a
            href="https://www.cnil.fr"
            className="text-magic underline-offset-2 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            www.cnil.fr
          </a>
          ), the French data protection authority.
        </p>
      </LegalSection>

      <LegalSection title="Related links">
        <p>
          <Link
            href="/legal-notice"
            className="text-magic underline-offset-2 hover:underline"
          >
            Legal notice
          </Link>
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
