import Link from "next/link";
import type { Metadata } from "next";
import { Draft, LegalPage } from "@/components/LegalPage";
import { TERMS_VERSION } from "@/lib/constants";

export const metadata: Metadata = { title: "Terms of use" };

const ul = (items: string[]) => (
  <ul className="list-disc space-y-1 pl-5">
    {items.map((i) => (
      <li key={i}>{i}</li>
    ))}
  </ul>
);

export default function Terms() {
  return (
    <LegalPage
      title="Terms of use"
      updated={TERMS_VERSION}
      intro={<Draft />}
      sections={[
        {
          h: "About these terms",
          body: (
            <>
              <p>
                These terms apply to everyone who uses drivemytruck.co.uk (&quot;Drive My Truck&quot;, &quot;we&quot;, &quot;us&quot;). Drive My Truck is
                operated by [company name], registered in England &amp; Wales (company number [number]), contact{" "}
                <a className="underline" href="mailto:hello@drivemytruck.co.uk">
                  hello@drivemytruck.co.uk
                </a>
                .
              </p>
              <p>By creating an account you agree to these terms and to our <Link className="underline" href="/privacy">privacy policy</Link>.</p>
            </>
          ),
        },
        {
          h: "What Drive My Truck is — and isn't",
          body: (
            <>
              <p>
                Drive My Truck is an online platform that introduces HGV drivers (&quot;Drivers&quot;) to transport operators and other hirers
                (&quot;Companies&quot;) for one-off shifts and permanent or regular roles.
              </p>
              {ul([
                "We are not the Driver's employer and we don't supply Drivers as an employment business. Any engagement is directly between the Driver and the Company.",
                "We don't direct, supervise or control the work, and we're not a party to the agreement between a Driver and a Company.",
                "The Company and the Driver agree pay, hours and the basis of engagement (e.g. PAYE, self-employed, limited company or umbrella) between themselves.",
              ])}
            </>
          ),
        },
        {
          h: "Accounts",
          body: ul([
            "You must be 18 or over and give accurate, up-to-date information.",
            "One person or business per account. Keep your password safe — you're responsible for activity on your account.",
            "Companies must be genuine businesses and may be asked for Companies House or operator licence details.",
          ]),
        },
        {
          h: "Fees",
          body: (
            <>
              {ul([
                "Drivers never pay to find work through Drive My Truck.",
                "Drive My Truck is currently free for Companies. We may introduce fees for Companies in future — for example booking fees, renewing adverts or optional premium features.",
                "We'll give at least 30 days' notice before any fee applies, you'll always see the price before you pay, and no fee will apply to bookings made before it was introduced.",
              ])}
            </>
          ),
        },
        {
          h: "Drivers' responsibilities",
          body: ul([
            "Keep your driving licence, Driver CPC, tachograph card and right-to-work details valid and accurate, and tell us if anything changes (e.g. a ban or new endorsements).",
            "Only accept work you are legally able to do — including drivers' hours and working time rules, counting work for other operators.",
            "Turn up for jobs you've been booked on, or cancel as early as possible.",
            "You're responsible for your own tax and status arrangements unless the Company employs you directly.",
          ]),
        },
        {
          h: "Companies' responsibilities",
          body: ul([
            "Hold any licences you need (e.g. an operator's licence) and make sure your vehicles are roadworthy and insured for the Driver you book.",
            "Provide a safe place of work and accurate job details, including any insurer requirements.",
            "Pay Drivers as agreed and on time.",
            "Carry out the checks the law requires of you as the hirer or employer — for example right-to-work checks, licence checks and, where it applies, IR35 status determinations. Our verification helps but does not replace your own legal checks.",
            "Job adverts must not discriminate unlawfully (Equality Act 2010).",
          ]),
        },
        {
          h: "Verification",
          body: (
            <p>
              We check the details Drivers give us against official services (such as the DVLA and Home Office) at the time of checking and show a
              “✓ Verified” badge when they match. We can&apos;t guarantee that information stays accurate afterwards. We check Companies against
              public records where we can.
            </p>
          ),
        },
        {
          h: "Bookings, cancellations and no-shows",
          body: ul([
            "Cancelling a booking less than 24 hours before the start counts as a late cancellation and is shown on your profile (for Drivers and Companies).",
            "If a Driver doesn't turn up, the Company can report a no-show after the start time. The Driver can dispute it and our team decides.",
            "After 3 no-shows that aren't overturned on appeal, a Driver's account is suspended.",
            "Reporting a no-show that didn't happen is a serious breach of these terms.",
          ]),
        },
        {
          h: "Reviews",
          body: (
            <>
              {ul([
                "Reviews can only be left after a real completed (or no-show) booking, and must be honest and about that job.",
                "Reviews are published when both sides have reviewed, or after 14 days.",
                "We don't remove reviews just because they're negative. We remove reviews that are fake, abusive, discriminatory, contain personal data or are otherwise unlawful.",
                "Offering or accepting anything in exchange for a review (positive or negative) is not allowed.",
              ])}
            </>
          ),
        },
        {
          h: "Contact details and fair use",
          body: ul([
            "Contact details are shared once a booking is confirmed, or with a Company when a Driver responds to a permanent role.",
            "Don't put phone numbers or email addresses in adverts, profiles, messages or reviews.",
            "Don't copy, scrape or collect other users' details, or use them for anything other than the job they were shared for.",
            "If fees for Companies are introduced, Companies agree not to use contact details obtained through Drive My Truck to arrange the same work off the platform in order to avoid those fees.",
          ]),
        },
        {
          h: "Acceptable use",
          body: ul([
            "No fake profiles, impersonation, spam or misleading adverts.",
            "No harassment, abuse or discrimination.",
            "Don't try to break, overload or get around the security of the platform.",
          ]),
        },
        {
          h: "Offers from partners",
          body: (
            <p>
              If you opt in, we may tell you about discounts and services from carefully chosen partners (for example CPC training, insurance or
              accountants). Partners are independent businesses; we may receive a commission if you buy from them. We don&apos;t give partners
              your contact details. You can opt out at any time on your Account page.
            </p>
          ),
        },
        {
          h: "Suspension and closing accounts",
          body: (
            <p>
              We may suspend or close accounts that break these terms, give false information or put others at risk. You can delete your account at
              any time from your Account page.
            </p>
          ),
        },
        {
          h: "Our liability",
          body: (
            <>
              <p>
                We provide the platform with reasonable care and skill, but we aren&apos;t responsible for the conduct of Drivers or Companies, for
                what happens during an engagement, or for payments between them.
              </p>
              <p>
                Nothing in these terms limits liability for death or personal injury caused by negligence, for fraud, or anything else that
                can&apos;t be limited by law. Otherwise, our total liability to you is limited to the greater of £100 or the fees you paid us in the
                previous 12 months. If you use Drive My Truck as a consumer, your statutory rights are not affected.
              </p>
            </>
          ),
        },
        {
          h: "Changes",
          body: <p>We may update these terms. We&apos;ll tell you about important changes by email or on the site before they take effect.</p>,
        },
        {
          h: "Law",
          body: (
            <p>
              These terms are governed by the law of England and Wales. If you live in Scotland or Northern Ireland, you can also bring
              proceedings there.
            </p>
          ),
        },
      ]}
    />
  );
}
