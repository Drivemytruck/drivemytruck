import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of use" };

export default function Terms() {
  return (
    <div className="page max-w-3xl space-y-4 text-slate-700">
      <h1 className="h1">Terms of use</h1>
      <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
        Draft — these terms are a starting point and must be reviewed by a solicitor before launch.
      </p>
      <h2 className="h2">1. What we do</h2>
      <p>
        Drive My Truck (“we”) operates an online platform that introduces HGV drivers (“Drivers”) to transport operators
        (“Companies”). We are not a party to any engagement between a Driver and a Company and we do not employ Drivers.
      </p>
      <h2 className="h2">2. Fees</h2>
      <p>
        We never charge Drivers a fee for finding them work. Companies may be charged a fee for successful bookings; any fee will be
        shown clearly before it applies.
      </p>
      <h2 className="h2">3. Your responsibilities</h2>
      <p>
        Drivers must keep their licence, CPC, tachograph card and right-to-work information accurate and up to date, and must comply
        with drivers&apos; hours and working time rules, including declaring work for other operators. Companies are responsible
        for insurance, vehicle roadworthiness, operator licence compliance and paying Drivers as agreed.
      </p>
      <h2 className="h2">4. Reviews</h2>
      <p>
        Reviews must be honest and based on a real completed job. We may remove reviews that are abusive, false or contain personal
        data.
      </p>
      <h2 className="h2">5. Accounts</h2>
      <p>We may suspend accounts that provide false information or misuse the platform.</p>
    </div>
  );
}
