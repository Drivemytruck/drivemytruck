import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "How we protect your data" };

const points = [
  { icon: "📵", t: "No document photos", d: "We never ask for photos or scans of your licence, CPC or passport — the documents most often stolen from websites." },
  { icon: "🔐", t: "Encrypted document numbers", d: "Licence, CPC, tacho and right-to-work numbers are encrypted in our database (AES-256)." },
  { icon: "🗑️", t: "Check codes deleted", d: "Your DVLA check code is deleted as soon as we've verified your licence." },
  { icon: "👀", t: "Companies see “✓ Verified”, not numbers", d: "Only our small verification team can see document details, and every admin action is logged." },
  { icon: "📞", t: "Your phone number stays private", d: "Contact details are only shared after a booking is confirmed (or when you respond to a permanent role)." },
  { icon: "🔑", t: "Strong account security", d: "Passwords are stored as secure hashes, repeated wrong passwords are blocked, and changing your password signs you out everywhere else." },
  { icon: "🔒", t: "Encrypted everywhere", d: "The whole site runs over HTTPS, our database is hosted in London, and emails are sent from our verified domain." },
  { icon: "🙋", t: "You're in control", d: "Download your data or delete your account any time from your Account page." },
];

export default function SecurityPage() {
  return (
    <div className="page max-w-3xl space-y-5">
      <div>
        <h1 className="h1">How we protect your data</h1>
        <p className="muted mt-1">We built Drive My Truck so drivers can prove they&apos;re qualified without handing over copies of their documents.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {points.map((p) => (
          <div key={p.t} className="card p-5">
            <div className="text-2xl" aria-hidden>
              {p.icon}
            </div>
            <h2 className="mt-2 font-bold text-navy-900">{p.t}</h2>
            <p className="mt-1 text-sm text-slate-600">{p.d}</p>
          </div>
        ))}
      </div>
      <p className="text-sm text-slate-600">
        Found a security problem? Email{" "}
        <a className="font-semibold underline" href="mailto:hello@drivemytruck.co.uk">
          hello@drivemytruck.co.uk
        </a>{" "}
        and we&apos;ll respond quickly. More detail in our{" "}
        <Link className="underline" href="/privacy">
          privacy policy
        </Link>
        .
      </p>
    </div>
  );
}
