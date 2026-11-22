import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy policy" };

export default function Privacy() {
  return (
    <div className="page max-w-3xl space-y-4 text-slate-700">
      <h1 className="h1">Privacy policy</h1>
      <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
        Draft — to be completed with the company&apos;s registered details and ICO registration number before launch.
      </p>
      <h2 className="h2">What we collect</h2>
      <p>
        Account details (name, email, password hash, postcode), profile details, and for Drivers: licence, CPC, tachograph card and
        right-to-work reference numbers and check codes, used only to verify eligibility to drive.
      </p>
      <h2 className="h2">Who can see it</h2>
      <p>
        Companies see a Driver&apos;s profile, verification status and reviews. Document numbers are only visible to our admin team.
        Phone numbers and emails are only shared between a Driver and a Company once a booking is confirmed.
      </p>
      <h2 className="h2">Your rights</h2>
      <p>
        Under UK GDPR you can ask for a copy of your data, correct it or ask us to delete your account. Contact us at
        <a className="underline" href="mailto:hello@drivemytruck.co.uk">hello@drivemytruck.co.uk</a>.
      </p>
    </div>
  );
}
