import type { Metadata } from "next";
import { LegalLayout } from "@/components/LegalLayout";
import { LEGAL } from "@/lib/legal";

const TITLE = "Privacy Policy";
const DESCRIPTION =
  "What data Cosme Check collects, how it is used, stored and protected, and your rights (access, correction, deletion) in compliance with GDPR.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: `${TITLE} · Cosme Check`,
    description: DESCRIPTION,
    url: "/privacy",
    type: "website",
  },
  robots: { index: true, follow: false },
};

export default function PrivacyPage() {
  return (
    <LegalLayout title={TITLE} current="privacy">
      <p>
        At {LEGAL.siteName}, we take the confidentiality of your data very
        seriously. This page explains transparently what we collect, why, where
        it is stored and what your rights are, in compliance with the General
        Data Protection Regulation (GDPR).
      </p>

      <h2>1. Data Controller</h2>
      <p>
        The data controller is <strong>{LEGAL.publisher.name}</strong>, publisher of{" "}
        {LEGAL.siteName}. For any questions about your personal data, you can
        contact us at&nbsp;:{" "}
        <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
      </p>

      <h2>2. Data Collected</h2>
      <h3>2.1 Data Provided Directly by You</h3>
      <ul>
        <li>
          <strong>Account Creation</strong>&nbsp;: first name, email address and
          password (encrypted, never stored in plain text).
        </li>
        <li>
          <strong>Google Sign-In</strong>&nbsp;: first name, email address and
          profile photo transmitted by Google. No other access to your Google
          account is requested.
        </li>
        <li>
          <strong>Analyzed Photos and INCI Lists</strong>&nbsp;: images you send
          via the scanner and ingredient lists you paste in the analyzer are
          processed to produce your analysis.
        </li>
        <li>
          <strong>Analysis History</strong>&nbsp;: if you are logged in, your
          analyses are saved so you can find them later.
        </li>
      </ul>

      <h3>2.2 Data Collected Automatically</h3>
      <ul>
        <li>
          <strong>Technical Data</strong>&nbsp;: device type, browser, IP address
          (anonymized), pages visited. Used only to measure audience and improve
          the site (via Vercel Analytics, without tracking cookies).
        </li>
        <li>
          <strong>Strictly Necessary Cookies</strong>&nbsp;: an encrypted session
          cookie to keep you logged in. No advertising or third-party tracking
          cookies.
        </li>
      </ul>

      <h2>3. Processing Purposes</h2>
      <ul>
        <li>Allow you to create an account and log in.</li>
        <li>Analyze the INCI lists and photos you submit to us.</li>
        <li>Save your analysis history and routine.</li>
        <li>Improve the site (anonymous audience measurement).</li>
        <li>Respond to your email requests.</li>
      </ul>

      <h2>4. Legal Basis</h2>
      <ul>
        <li>
          <strong>Contract Performance</strong>&nbsp;: account creation, history
          saving, analyses (GDPR Art. 6.1.b).
        </li>
        <li>
          <strong>Legitimate Interest</strong>&nbsp;: anonymous audience
          measurement and site security (Art. 6.1.f).
        </li>
        <li>
          <strong>Consent</strong>&nbsp;: when you choose to sign in with Google
          (Art. 6.1.a).
        </li>
      </ul>

      <h2>5. Processors and Recipients</h2>
      <p>
        Your data is never sold or transferred to third parties for commercial
        purposes. It is only processed by the following technical processors,
        chosen for their GDPR compliance&nbsp;:
      </p>
      <ul>
        {LEGAL.dataProcessors.map((p) => (
          <li key={p.name}>
            <strong>{p.name}</strong> - {p.role}. Location&nbsp;: {p.location}.{" "}
            <a href={p.website} target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>
            .
          </li>
        ))}
      </ul>
      <p>
        Some of these processors are located outside the European Union
        (particularly in the United States). In such cases, appropriate
        safeguards (Standard Contractual Clauses from the European Commission)
        are in place.
      </p>

      <h2>6. Data Retention Period</h2>
      <ul>
        <li>
          <strong>User Account</strong>&nbsp;: as long as your account is active,
          then deleted on request or after 3 years of inactivity.
        </li>
        <li>
          <strong>Analyzed Photos</strong>&nbsp;: images sent to OCR are not
          retained on our servers after processing. Only the extracted text
          (INCI list) is retained with your analysis.
        </li>
        <li>
          <strong>Technical Logs</strong>&nbsp;: maximum 30 days.
        </li>
      </ul>

      <h2>7. Your Rights</h2>
      <p>Under GDPR, you have the following rights&nbsp;:</p>
      <ul>
        <li>
          <strong>Right of Access</strong>&nbsp;: obtain a copy of your data.
        </li>
        <li>
          <strong>Right to Rectification</strong>&nbsp;: correct inaccurate data.
        </li>
        <li>
          <strong>Right to Erasure</strong>&nbsp;: request deletion of your
          account and all your data.
        </li>
        <li>
          <strong>Right to Data Portability</strong>&nbsp;: retrieve your
          analyses in a reusable format.
        </li>
        <li>
          <strong>Right to Object</strong>&nbsp;: object to processing for
          legitimate reasons.
        </li>
        <li>
          <strong>Right to Withdraw Consent</strong>&nbsp;: at any time, without
          retroactive effect.
        </li>
      </ul>
      <p>
        To exercise these rights, write to us at{" "}
        <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>. You
        can also file a complaint with your supervisory authority
        (<a href="https://edpb.europa.eu" target="_blank" rel="noopener noreferrer">
          EDPB
        </a>
        ).
      </p>

      <h2>8. Security</h2>
      <p>
        Passwords are encrypted (bcrypt hash on Supabase Auth side), exchanges
        between your browser and our servers are encrypted via HTTPS (TLS 1.2
        minimum), and database access is restricted via Row Level Security
        policies.
      </p>

      <h2>9. Cookies</h2>
      <p>
        Cosme Check uses only strictly necessary cookies for site operation
        (login session). No advertising or third-party tracking cookies are
        placed on your device. No consent banner is required in this
        configuration.
      </p>

      <h2>10. Minors</h2>
      <p>
        Cosme Check is not intended for children under 15 years of age. If you
        are a minor, ask your parents for permission before creating an account.
      </p>

      <h2>11. Changes</h2>
      <p>
        This policy may be updated to reflect technical or legal changes. The
        date of last update is indicated at the top of the page. If we make
        significant changes, we will notify you by email if you have an account.
      </p>
    </LegalLayout>
  );
}
