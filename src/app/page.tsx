import Image from "next/image";
import Link from "next/link";

const features = [
  { icon: "🛡️", title: "Verified drivers", text: "Licence, CPC, tacho and right to work checked with official gov.uk services." },
  { icon: "⚡", title: "Fast & simple", text: "Post a shift in under a minute. Drivers nearby see it straight away." },
  { icon: "⭐", title: "Honest reviews", text: "Drivers rate companies, companies rate drivers. Both ways, after every job." },
  { icon: "💷", title: "No agency mark-up", text: "Drivers set their own rate and keep it. Free for drivers, always." },
];

const driverSteps = [
  "Create your free profile — licence class, area, your rate.",
  "Add your documents once and get the ✓ Verified badge.",
  "Mark the days you're available or tap “Available today”.",
  "Say “I'm available” to jobs you like, or accept invites.",
];
const companySteps = [
  "Post a job: class, location, start time, pay.",
  "See available drivers nearby, with reviews and credentials.",
  "Book the driver you want — get their contact details instantly.",
  "After the job, mark it done and leave a review.",
];

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden bg-navy-950 text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(60% 80% at 85% 20%, rgba(227,27,35,.35), transparent 60%), radial-gradient(50% 60% at 10% 90%, rgba(29,74,140,.6), transparent 70%)",
          }}
        />
        <div className="relative mx-auto grid max-w-5xl gap-10 px-4 py-14 sm:px-6 sm:py-20 md:grid-cols-[1.3fr_1fr] md:items-center">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] text-brand-500 uppercase">Drivers • Jobs • Opportunities</p>
            <h1 className="mt-4 text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-6xl">
              Right Driver.
              <br />
              Right Job.
              <br />
              <span className="text-brand-500">Right Now.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-slate-300">
              Drive My Truck connects HGV drivers with transport companies that need reliable, verified drivers — today, tomorrow or
              next week. Simple. Fast. Fair.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register?role=driver" className="btn-primary px-7 py-4 text-base">
                I&apos;m a Driver →
              </Link>
              <Link href="/register?role=company" className="btn border border-white/40 px-7 py-4 text-base text-white hover:bg-white/10">
                I&apos;m a Company →
              </Link>
            </div>
            <p className="mt-6 text-2xl text-white/80 italic">Keep Britain Moving</p>
          </div>
          <div className="mx-auto w-full max-w-sm">
            <div className="rotate-1 rounded-3xl bg-white p-4 text-slate-900 shadow-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-navy-900">Class 1 (C+E) driver</p>
                  <p className="text-sm text-slate-600">Midlands Freight Ltd <span className="chip bg-emerald-50 text-emerald-700">✓ Verified</span></p>
                  <p className="text-xs text-amber-500">★★★★★ <span className="text-slate-700">4.8 (32)</span></p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-extrabold text-navy-900">£250</p>
                  <p className="text-xs text-slate-500">per shift</p>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-sm text-slate-600">
                <p>📍 Birmingham · 6 miles away</p>
                <p>🕒 Tomorrow, 18:00 start · approx 10 h</p>
                <p>🚛 Trunking · Curtainsider</p>
              </div>
              <div className="btn-primary mt-4 w-full">I&apos;m available →</div>
            </div>
            <p className="mt-3 text-center text-xs text-slate-400">Example job</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="card p-5">
              <div className="text-3xl" aria-hidden>
                {f.icon}
              </div>
              <h3 className="mt-3 font-bold text-navy-900">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-2">
          {[
            { who: "For drivers", sub: "Find flexible work on your terms.", steps: driverSteps, cta: "Join as a driver", href: "/register?role=driver" },
            { who: "For companies", sub: "Get a reliable driver in minutes.", steps: companySteps, cta: "Post your first job", href: "/register?role=company" },
          ].map((col) => (
            <div key={col.who}>
              <h2 className="text-2xl font-extrabold text-navy-900">{col.who}</h2>
              <p className="muted">{col.sub}</p>
              <ol className="mt-5 space-y-3">
                {col.steps.map((s, i) => (
                  <li key={s} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">{i + 1}</span>
                    <span className="pt-0.5 text-slate-700">{s}</span>
                  </li>
                ))}
              </ol>
              <Link href={col.href} className="btn-navy mt-6">
                {col.cta} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 text-center sm:px-6">
        <Image src="/logo-full.png" alt="Drive My Truck — Drivers, Jobs, Opportunities" width={420} height={178} className="mx-auto h-auto w-72 sm:w-96" />
        <p className="mx-auto mt-6 max-w-xl text-slate-600">
          Built for the UK haulage industry. Free for drivers. Free for companies during our launch period.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/register" className="btn-primary px-7 py-4 text-base">
            Get started — it&apos;s free
          </Link>
          <Link href="/how-it-works" className="btn-outline px-7 py-4 text-base">
            How it works
          </Link>
        </div>
      </section>
    </>
  );
}
