import Image from "next/image";
import Link from "next/link";
import { getDict } from "@/lib/i18n";

export default async function Home({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const { deleted } = await searchParams;
  const { t: d } = await getDict();
  const t = d.home;
  return (
    <>
      {deleted && (
        <div className="bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-900">{t.deleted}</div>
      )}
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
            <p className="text-xs font-semibold tracking-[0.25em] text-brand-500 uppercase">{t.kicker}</p>
            <h1 className="mt-4 text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-6xl">
              {t.h1a}
              <br />
              {t.h1b}
              <br />
              <span className="text-brand-500">{t.h1c}</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-slate-300">
              {t.lead}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register?role=driver" className="btn-primary px-7 py-4 text-base">
                {t.ctaDriver}
              </Link>
              <Link href="/register?role=company" className="btn border border-white/40 px-7 py-4 text-base text-white hover:bg-white/10">
                {t.ctaCompany}
              </Link>
            </div>
            <p className="mt-6 text-2xl text-white/80 italic">{t.slogan}</p>
          </div>
          <div className="mx-auto w-full max-w-sm">
            <div className="rounded-3xl bg-white p-4 text-slate-900 shadow-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-navy-900">{t.example.title}</p>
                  <p className="text-sm text-slate-600">Midlands Freight Ltd <span className="chip bg-emerald-50 text-emerald-700">✓ Verified</span></p>
                  <p className="text-xs text-amber-500">★★★★★ <span className="text-slate-700">4.8 (32)</span></p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-extrabold text-navy-900">£250</p>
                  <p className="text-xs text-slate-500">{t.example.perShift}</p>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-sm text-slate-600">
                <p>{t.example.where}</p>
                <p>{t.example.when}</p>
                <p>{t.example.what}</p>
              </div>
              <div className="btn-primary mt-4 w-full">{t.example.cta}</div>
            </div>
            <p className="mt-3 text-center text-xs text-slate-400">{t.example.caption}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.features.map((f) => (
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
            { who: t.forDrivers, sub: t.forDriversSub, steps: t.driverSteps, cta: t.joinDriver, href: "/register?role=driver" },
            { who: t.forCompanies, sub: t.forCompaniesSub, steps: t.companySteps, cta: t.postFirst, href: "/register?role=company" },
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
          {t.bottom}
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/register" className="btn-primary px-7 py-4 text-base">
            {t.getStartedFree}
          </Link>
          <Link href="/how-it-works" className="btn-outline px-7 py-4 text-base">
            {t.howItWorks}
          </Link>
        </div>
      </section>
    </>
  );
}
