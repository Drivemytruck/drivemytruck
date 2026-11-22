import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "How it works" };

const faqs = [
  {
    q: "How much does it cost?",
    a: "Drivers never pay to find work. Companies use Drive My Truck free during our launch period; after that we'll charge companies a small booking fee, announced well in advance.",
  },
  {
    q: "Who pays the driver?",
    a: "The company pays the driver directly, as agreed between them (e.g. via the driver's limited company, umbrella company or PAYE). Drive My Truck is an introduction platform and isn't the driver's employer.",
  },
  {
    q: "How are drivers verified?",
    a: "Drivers give us a DVLA licence check code, their CPC (DQC) and tacho card details and right-to-work share code. We check these with the official gov.uk services before showing the ✓ Verified badge.",
  },
  {
    q: "How do reviews work?",
    a: "After a completed job, both sides can leave a 1–5 star review. Reviews are blind — neither side sees the other's until both have posted, or 14 days have passed — so they stay honest.",
  },
  {
    q: "What about drivers' hours?",
    a: "Drivers must make sure they've had their legal rest and stay within driving and working time limits, including hours worked for other operators. Companies remain responsible for drivers' hours compliance on their operator licence.",
  },
  {
    q: "What about insurance?",
    a: "The company's fleet insurance must cover the driver. Companies should list any insurer requirements (e.g. minimum age or maximum points) in the job's requirements.",
  },
];

export default function HowItWorks() {
  return (
    <div className="page max-w-3xl space-y-6">
      <h1 className="h1">How Drive My Truck works</h1>
      <p className="text-slate-700">
        Drive My Truck is a simple marketplace connecting HGV drivers looking for extra or ad-hoc work with transport companies
        that need a driver — often at short notice.
      </p>
      <div className="space-y-3">
        {faqs.map((f) => (
          <details key={f.q} className="card group p-5" open>
            <summary className="cursor-pointer list-none font-bold text-navy-900">{f.q}</summary>
            <p className="mt-2 text-slate-700">{f.a}</p>
          </details>
        ))}
      </div>
      <div className="card p-5">
        <h2 className="h2">Questions or feedback?</h2>
        <p className="mt-1 text-slate-700">
          Need help: <a className="font-semibold text-brand-600 underline" href="mailto:help@drivemytruck.co.uk">help@drivemytruck.co.uk</a>
          <br />
          Partnerships, agencies &amp; everything else:{" "}
          <a className="font-semibold text-brand-600 underline" href="mailto:hello@drivemytruck.co.uk">hello@drivemytruck.co.uk</a>
        </p>
      </div>
      <Link href="/register" className="btn-primary">
        Create a free account
      </Link>
    </div>
  );
}
