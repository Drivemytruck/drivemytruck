import Link from "next/link";
import type { Metadata } from "next";
import { Draft, LegalPage } from "@/components/LegalPage";
import { TERMS_VERSION } from "@/lib/constants";

export const metadata: Metadata = { title: "Privacy policy" };

const ul = (items: React.ReactNode[]) => (
  <ul className="list-disc space-y-1 pl-5">
    {items.map((i, n) => (
      <li key={n}>{i}</li>
    ))}
  </ul>
);

const rows: [string, string, string][] = [
  ["Running your account, matching drivers and jobs, bookings", "Name, email, phone, postcode, profile, availability, jobs", "Contract"],
  ["Verifying drivers' eligibility to drive and work", "Licence number & DVLA check code, CPC, tacho, right-to-work share code", "Contract; legal obligation; legitimate interests (safety)"],
  ["Reviews, no-show and cancellation records", "Ratings, comments, reliability history", "Legitimate interests (trust & safety for all users)"],
  ["Service emails (e.g. password reset, advert expiring)", "Email address", "Contract"],
  ["Partner offers and discounts", "Email address", "Consent — optional, withdraw any time"],
  ["Security and preventing misuse", "Login attempts, admin action logs, technical logs", "Legitimate interests; legal obligation"],
];

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy policy"
      updated={TERMS_VERSION}
      intro={<Draft />}
      sections={[
        {
          h: "Who we are",
          body: (
            <p>
              Drive My Truck (drivemytruck.co.uk) is operated by [company name], registered in England &amp; Wales (company number [number]),
              registered with the Information Commissioner&apos;s Office (ICO registration [number]). We are the controller of your personal data.
              Contact:{" "}
              <a className="underline" href="mailto:hello@drivemytruck.co.uk">
                hello@drivemytruck.co.uk
              </a>
              .
            </p>
          ),
        },
        {
          h: "What we collect and why",
          body: (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-navy-900">
                    <th className="py-2 pr-3">Purpose</th>
                    <th className="py-2 pr-3">Data</th>
                    <th className="py-2">Lawful basis</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(([a, b, c]) => (
                    <tr key={a} className="border-b border-slate-100 align-top">
                      <td className="py-2 pr-3">{a}</td>
                      <td className="py-2 pr-3">{b}</td>
                      <td className="py-2">{c}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ),
        },
        {
          h: "Driving licence information",
          body: (
            <>
              <p>
                We don&apos;t ask for photos or scans of documents. Drivers give us document numbers and a one-time DVLA check code, which our team
                uses on the official gov.uk service to confirm licence categories and validity.
              </p>
              <p>
                A licence check can show endorsements (penalty points), which UK law treats as criminal offence data. We only use it to confirm a
                driver is eligible to drive the vehicles they offer to drive, we don&apos;t store the details of endorsements, and we process it under
                the conditions in Schedule 1 of the Data Protection Act 2018 with an appropriate policy document in place.
              </p>
            </>
          ),
        },
        {
          h: "Who can see your information",
          body: ul([
            "Companies see a driver's name, photo, licence classes, skills, area (town), rate, availability, reviews, reliability and “✓ Verified” status — never document numbers.",
            "Drivers see a company's name, logo, area, adverts, reviews and reliability.",
            "Phone numbers and email addresses are shared only after a booking is confirmed, or with a company when a driver responds to a permanent role.",
            "Our small admin team can see account and document details to verify and support users. Admin actions are logged.",
          ]),
        },
        {
          h: "Service providers we use",
          body: (
            <>
              {ul([
                "Vercel — website hosting (may process data in the US under UK-approved safeguards).",
                "Neon — database, hosted in London.",
                "Resend — sending emails (EU, Ireland).",
                "Namecheap — our email mailbox.",
                "OpenStreetMap — map images (your browser loads map tiles directly, which shares your IP address with their servers).",
                "postcodes.io — turning postcodes into approximate locations (only the postcode is sent).",
              ])}
              <p>We don&apos;t sell your data, and partners whose offers we share never receive your contact details.</p>
            </>
          ),
        },
        {
          h: "How long we keep it",
          body: ul([
            "Your account and profile: while your account is open. When you delete your account we delete your profile, documents, availability, photo, applications, bookings and reviews linked to you.",
            "DVLA check codes: deleted as soon as the licence has been verified.",
            "Failed login records: 24 hours. Password reset links: up to 7 days.",
            "Backups held by our providers are overwritten within about 30 days.",
          ]),
        },
        {
          h: "How we protect it",
          body: (
            <p>
              Encrypted connections (HTTPS) everywhere, document numbers encrypted in our database, passwords stored only as secure hashes, limits
              on login attempts, sign-out from all devices after a password change, and logged admin access. See{" "}
              <Link className="underline" href="/security">
                how we protect your data
              </Link>
              .
            </p>
          ),
        },
        {
          h: "Cookies",
          body: (
            <p>
              We only use one strictly necessary cookie (<code>dmt_session</code>) to keep you signed in. We don&apos;t use advertising or analytics
              cookies. If that ever changes, we&apos;ll ask for your consent first.
            </p>
          ),
        },
        {
          h: "Your rights",
          body: (
            <>
              {ul([
                <>
                  Access your data — download it any time from your <Link className="underline" href="/account">Account page</Link>.
                </>,
                "Correct it — edit your profile, or ask us.",
                <>
                  Delete it — delete your account from your <Link className="underline" href="/account">Account page</Link>.
                </>,
                "Object to or restrict some uses, and withdraw marketing consent at any time.",
                "Complain to the ICO (ico.org.uk) — but please talk to us first so we can put it right.",
              ])}
            </>
          ),
        },
        {
          h: "Children",
          body: <p>Drive My Truck is for adults only (18+).</p>,
        },
        {
          h: "Changes",
          body: <p>We&apos;ll update this page and tell you about important changes before they take effect.</p>,
        },
      ]}
    />
  );
}
